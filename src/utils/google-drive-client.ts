import { google, drive_v3 } from 'googleapis'
import type { OAuth2Client } from 'google-auth-library'
import { GeneralError } from '@feathersjs/errors'
import { logger } from '../logger'
import axios from 'axios'

// Types for Google Drive operations
export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  parents?: string[]
  createdTime?: string
  modifiedTime?: string
  webViewLink?: string
  webContentLink?: string
  thumbnailLink?: string
}

export interface CreateFolderOptions {
  name: string
  parentId?: string
  description?: string
}

export interface UploadFileOptions {
  fileName: string
  mimeType: string
  folderId: string
  fileContent: Buffer | NodeJS.ReadableStream
  description?: string
}

export interface ListFilesOptions {
  folderId?: string
  pageSize?: number
  pageToken?: string
  orderBy?: string
  query?: string
}

// MIME types
export const MIME_TYPES = {
  FOLDER: 'application/vnd.google-apps.folder',
  PDF: 'application/pdf',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  DOC: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLS: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

export class GoogleDriveClient {
  private drive: drive_v3.Drive
  private auth: OAuth2Client
  private sharedDriveId?: string

  constructor(auth: OAuth2Client, sharedDriveId?: string) {
    this.auth = auth
    this.drive = google.drive({ version: 'v3', auth })
    this.sharedDriveId = sharedDriveId
  }

  /**
   * Get the shared drive ID
   */
  getSharedDriveId(): string | undefined {
    return this.sharedDriveId
  }

  /**
   * Create a GoogleDriveClient using service account credentials
   */
  static async createServiceAccountClient(): Promise<GoogleDriveClient> {
    try {
      logger.debug('Creating service account client')
      const serviceAccountJson = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT
      if (!serviceAccountJson) {
        logger.error(
          'GOOGLE_DRIVE_SERVICE_ACCOUNT environment variable not set',
        )
        throw new GeneralError(
          'Google Drive service account credentials not configured',
        )
      }

      const serviceAccount = JSON.parse(serviceAccountJson)
      logger.debug('Service account parsed', {
        client_email: serviceAccount.client_email,
        has_private_key: !!serviceAccount.private_key,
      })

      // Create JWT client for service account
      const impersonateEmail = process.env.GOOGLE_WORKSPACE_IMPERSONATE_EMAIL
      const authConfig: any = {
        email: serviceAccount.client_email,
        key: serviceAccount.private_key,
        scopes: [
          // 'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file',
          // 'https://www.googleapis.com/auth/drive.metadata',
        ],
      }

      // Only add subject if impersonation email is configured
      if (impersonateEmail && impersonateEmail.trim() !== '') {
        authConfig.subject = impersonateEmail
        logger.debug('Using impersonation for:', impersonateEmail)
      }

      const auth = new google.auth.JWT(authConfig)

      await auth.authorize()
      logger.info('Google Drive service account authenticated successfully')

      // Get the configured shared drive ID
      const sharedDriveId = await GoogleDriveClient.getSharedDriveId()
      logger.debug('Service account client initialized', {
        sharedDriveId,
      })

      return new GoogleDriveClient(auth, sharedDriveId)
    } catch (error) {
      logger.error('Failed to create service account client', error)
      throw new GeneralError('Failed to initialize Google Drive service')
    }
  }

  /**
   * Create a GoogleDriveClient using user's OAuth2 access token
   */
  static async createUserClient(
    accessToken: string,
  ): Promise<GoogleDriveClient> {
    try {
      const auth = new google.auth.OAuth2()
      auth.setCredentials({
        access_token: accessToken,
        scope: 'https://www.googleapis.com/auth/drive.file',
      })

      return new GoogleDriveClient(auth)
    } catch (error) {
      logger.error('Failed to create user client', error)
      throw new GeneralError(
        'Failed to initialize Google Drive client for user',
      )
    }
  }

  /**
   * Get the configured shared drive ID
   */
  private static async getSharedDriveId(): Promise<string> {
    const sharedDriveId = process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID
    if (!sharedDriveId) {
      logger.error('GOOGLE_DRIVE_SHARED_DRIVE_ID environment variable not set')
      throw new GeneralError(
        'Google Drive shared drive ID not configured. Please set GOOGLE_DRIVE_SHARED_DRIVE_ID environment variable.',
      )
    }

    logger.info(`Using configured shared drive ID: ${sharedDriveId}`)
    return sharedDriveId
  }

  /**
   * Create a folder in Google Drive
   */
  async createFolder(options: CreateFolderOptions): Promise<DriveFile> {
    try {
      const parentIds = options.parentId
        ? [options.parentId]
        : this.sharedDriveId
          ? [this.sharedDriveId]
          : undefined

      logger.debug('Creating folder in Google Drive', {
        name: options.name,
        parents: parentIds,
        sharedDriveId: this.sharedDriveId,
        description: options.description,
      })

      const fileMetadata: drive_v3.Schema$File = {
        name: options.name,
        mimeType: MIME_TYPES.FOLDER,
        parents: parentIds,
        description: options.description,
      }

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name, mimeType, parents, createdTime, modifiedTime',
        supportsAllDrives: true,
      })

      logger.debug('Google Drive API response for folder creation', {
        id: response.data.id,
        name: response.data.name,
        parents: response.data.parents,
        status: response.status,
      })

      if (!response.data.id) {
        logger.error('Failed to create folder - no ID returned', {
          requestBody: fileMetadata,
          response: response.data,
        })
        throw new GeneralError('Failed to create folder')
      }

      logger.info(`Created folder: ${options.name} (${response.data.id})`)

      return {
        id: response.data.id,
        name: response.data.name || options.name,
        mimeType: response.data.mimeType || MIME_TYPES.FOLDER,
        parents: response.data.parents || [],
        createdTime: response.data.createdTime || undefined,
        modifiedTime: response.data.modifiedTime || undefined,
      }
    } catch (error) {
      logger.error('Failed to create folder', { options, error })
      throw new GeneralError(`Failed to create folder: ${options.name}`)
    }
  }

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(options: UploadFileOptions): Promise<DriveFile> {
    try {
      logger.debug('Uploading file to Google Drive', {
        fileName: options.fileName,
        folderId: options.folderId,
        mimeType: options.mimeType,
        description: options.description,
      })

      const fileMetadata: drive_v3.Schema$File = {
        name: options.fileName,
        parents: [options.folderId],
        description: options.description,
      }

      const media = {
        mimeType: options.mimeType,
        body: options.fileContent,
      }

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields:
          'id, name, mimeType, size, parents, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink',
        supportsAllDrives: true,
      })

      logger.debug('Google Drive API response for file upload', {
        id: response.data.id,
        name: response.data.name,
        size: response.data.size,
        parents: response.data.parents,
        webViewLink: response.data.webViewLink,
        status: response.status,
      })

      if (!response.data.id) {
        logger.error('Failed to upload file - no ID returned', {
          fileName: options.fileName,
          response: response.data,
        })
        throw new GeneralError('Failed to upload file')
      }

      logger.info(`Uploaded file: ${options.fileName} (${response.data.id})`)

      return {
        id: response.data.id,
        name: response.data.name || options.fileName,
        mimeType: response.data.mimeType || options.mimeType,
        size: response.data.size || undefined,
        parents: response.data.parents || [],
        createdTime: response.data.createdTime || undefined,
        modifiedTime: response.data.modifiedTime || undefined,
        webViewLink: response.data.webViewLink || undefined,
        webContentLink: response.data.webContentLink || undefined,
        thumbnailLink: response.data.thumbnailLink || undefined,
      }
    } catch (error) {
      logger.error('Failed to upload file', {
        fileName: options.fileName,
        error,
      })
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      throw new GeneralError(
        `Failed to upload file: ${options.fileName}. ${errorMessage}`,
      )
    }
  }

  /**
   * Initiate a resumable upload session
   * Returns the session URI for uploading chunks
   */
  async initiateResumableUpload(options: {
    fileName: string
    mimeType: string
    folderId: string
    fileSize: number
    description?: string
  }): Promise<string> {
    try {
      const fileMetadata: drive_v3.Schema$File = {
        name: options.fileName,
        parents: [options.folderId],
        description: options.description,
      }

      const accessToken = await this.auth.getAccessToken()
      if (!accessToken.token) {
        throw new GeneralError('Failed to get access token')
      }

      const response = await axios.post(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true',
        fileMetadata,
        {
          headers: {
            Authorization: `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Type': options.mimeType,
            'X-Upload-Content-Length': options.fileSize.toString(),
          },
        },
      )

      const sessionUri = response.headers['location']
      if (!sessionUri) {
        throw new GeneralError('Failed to get resumable session URI')
      }

      logger.info('Resumable upload session initiated', {
        fileName: options.fileName,
      })

      return sessionUri
    } catch (error) {
      logger.error('Failed to initiate resumable upload', {
        fileName: options.fileName,
        error,
      })
      throw error
    }
  }

  /**
   * Upload a chunk to a resumable session
   */
  async uploadChunkToSession(
    sessionUri: string,
    chunkData: Buffer,
    startByte: number,
    totalSize: number,
  ): Promise<{ complete: boolean; fileId?: string; progress: number }> {
    try {
      const endByte = startByte + chunkData.length - 1
      const contentRange = `bytes ${startByte}-${endByte}/${totalSize}`

      const response = await axios.put(sessionUri, chunkData, {
        headers: {
          'Content-Length': chunkData.length.toString(),
          'Content-Range': contentRange,
        },
        validateStatus: (status) =>
          status === 200 || status === 201 || status === 308,
      })

      const progress = Math.round(((endByte + 1) / totalSize) * 100)

      // 200/201 = upload complete, 308 = more chunks needed
      if (response.status === 200 || response.status === 201) {
        return {
          complete: true,
          fileId: response.data?.id,
          progress: 100,
        }
      }

      return {
        complete: false,
        progress,
      }
    } catch (error) {
      logger.error('Failed to upload chunk', {
        startByte,
        error,
      })
      throw error
    }
  }

  /**
   * Get the upload status of a resumable session
   */
  async getResumableUploadStatus(
    sessionUri: string,
    totalSize: number,
  ): Promise<number> {
    try {
      const response = await axios.put(sessionUri, null, {
        headers: {
          'Content-Length': '0',
          'Content-Range': `bytes */${totalSize}`,
        },
        validateStatus: (status) => status === 200 || status === 308,
      })

      if (response.status === 200) {
        return totalSize // Upload complete
      }

      // Parse Range header to get last uploaded byte
      const rangeHeader = response.headers['range']
      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=0-(\d+)/)
        if (match) {
          return parseInt(match[1]) + 1
        }
      }

      return 0
    } catch (error) {
      logger.error('Failed to get resumable upload status', {
        sessionUri,
        error,
      })
      throw error
    }
  }

  /**
   * Get file details by ID
   */
  async getFile(fileId: string): Promise<DriveFile> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields:
          'id, name, mimeType, size, parents, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink',
        supportsAllDrives: true,
      })

      if (!response.data.id) {
        throw new GeneralError(`File not found: ${fileId}`)
      }

      return {
        id: response.data.id,
        name: response.data.name || '',
        mimeType: response.data.mimeType || '',
        size: response.data.size || undefined,
        parents: response.data.parents || undefined,
        createdTime: response.data.createdTime || undefined,
        modifiedTime: response.data.modifiedTime || undefined,
        webViewLink: response.data.webViewLink || undefined,
        webContentLink: response.data.webContentLink || undefined,
        thumbnailLink: response.data.thumbnailLink || undefined,
      }
    } catch (error) {
      logger.error('Failed to get file', { fileId, error })
      throw error
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(
    options: ListFilesOptions = {},
  ): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
    try {
      let query = 'trashed = false'

      if (options.folderId) {
        query += ` and '${options.folderId}' in parents`
      } else if (this.sharedDriveId) {
        query += ` and '${this.sharedDriveId}' in parents`
      }

      if (options.query) {
        query += ` and ${options.query}`
      }

      logger.debug('Listing files with query', {
        query,
        folderId: options.folderId,
        sharedDriveId: this.sharedDriveId,
        hasSharedDrive: !!this.sharedDriveId,
      })

      const requestParams: any = {
        q: query,
        pageSize: options.pageSize || 100,
        pageToken: options.pageToken,
        orderBy: options.orderBy || 'modifiedTime desc',
        fields:
          'nextPageToken, files(id, name, mimeType, size, parents, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      }

      // When searching in a shared drive, we need to specify the drive and use the correct corpora
      if (this.sharedDriveId && !options.folderId) {
        requestParams.driveId = this.sharedDriveId
        requestParams.corpora = 'drive'
      }

      const response = await this.drive.files.list(requestParams)

      const files: DriveFile[] =
        response.data.files?.map((file) => ({
          id: file.id!,
          name: file.name!,
          mimeType: file.mimeType!,
          size: file.size || undefined,
          parents: file.parents || [],
          createdTime: file.createdTime || undefined,
          modifiedTime: file.modifiedTime || undefined,
          webViewLink: file.webViewLink || undefined,
          webContentLink: file.webContentLink || undefined,
          thumbnailLink: file.thumbnailLink || undefined,
        })) || []

      logger.debug('List files response', {
        fileCount: files.length,
        files: files.map((f) => ({
          id: f.id,
          name: f.name,
          parents: f.parents,
        })),
      })

      return {
        files,
        nextPageToken: response.data.nextPageToken || undefined,
      }
    } catch (error) {
      logger.error('Failed to list files', { options, error })
      throw new GeneralError('Failed to list files')
    }
  }

  /**
   * Get a file by ID
   */
  /**
   * Download a file from Google Drive
   */
  async downloadFile(fileId: string): Promise<NodeJS.ReadableStream> {
    try {
      const response = await this.drive.files.get(
        {
          fileId,
          alt: 'media',
          supportsAllDrives: true,
        },
        {
          responseType: 'stream',
        },
      )

      return response.data as NodeJS.ReadableStream
    } catch (error) {
      logger.error('Failed to download file', { fileId, error })
      throw new GeneralError(`Failed to download file: ${fileId}`)
    }
  }

  /**
   * Download a partial chunk of a file using HTTP Range headers
   * @param fileId The Google Drive file ID
   * @param startByte The starting byte position (inclusive)
   * @param endByte The ending byte position (inclusive)
   * @returns Buffer containing the requested byte range
   */
  async downloadFileChunk(
    fileId: string,
    startByte: number,
    endByte: number,
  ): Promise<Buffer> {
    try {
      const accessToken = await this.auth.getAccessToken()
      if (!accessToken.token) {
        throw new GeneralError('Failed to get access token')
      }

      logger.debug('Downloading file chunk with range request', {
        fileId,
        startByte,
        endByte,
        rangeSize: endByte - startByte + 1,
      })

      const response = await axios.get(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken.token}`,
            Range: `bytes=${startByte}-${endByte}`,
          },
          responseType: 'arraybuffer',
        },
      )

      logger.debug('File chunk downloaded', {
        fileId,
        startByte,
        endByte,
        bytesReceived: response.data.byteLength,
        status: response.status,
      })

      return Buffer.from(response.data)
    } catch (error) {
      logger.error('Failed to download file chunk', {
        fileId,
        startByte,
        endByte,
        error,
      })
      throw new GeneralError(
        `Failed to download file chunk: ${fileId} (${startByte}-${endByte})`,
      )
    }
  }

  /**
   * Delete a file from Google Drive
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId,
        supportsAllDrives: true,
      })
      logger.info(`Deleted file: ${fileId}`)
    } catch (error) {
      logger.error('Failed to delete file', { fileId, error })
      throw new GeneralError(`Failed to delete file: ${fileId}`)
    }
  }

  /**
   * Move a file to a different folder
   */
  async moveFile(fileId: string, newParentId: string): Promise<DriveFile> {
    try {
      // First get the file to find current parents
      const file = await this.getFile(fileId)
      const previousParents = file.parents?.join(',') || ''

      const response = await this.drive.files.update({
        fileId,
        addParents: newParentId,
        removeParents: previousParents,
        fields: 'id, name, mimeType, size, parents, createdTime, modifiedTime',
        supportsAllDrives: true,
      })

      logger.info(`Moved file ${fileId} to folder ${newParentId}`)

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        size: response.data.size || undefined,
        parents: response.data.parents || [],
        createdTime: response.data.createdTime || undefined,
        modifiedTime: response.data.modifiedTime || undefined,
      }
    } catch (error) {
      logger.error('Failed to move file', { fileId, newParentId, error })
      throw new GeneralError(`Failed to move file: ${fileId}`)
    }
  }

  /**
   * Create a book folder structure
   */
  async createBookFolderStructure(
    bookId: number,
    bookTitle: string,
  ): Promise<{ folderId: string; subfolders: Record<string, string> }> {
    try {
      logger.debug('Creating book folder structure', {
        bookId,
        bookTitle,
        sharedDriveId: this.sharedDriveId,
      })

      // Create main book folder directly in the shared drive root
      const sanitizedTitle = bookTitle
        .replace(/[<>:"/\\|?*]/g, '_')
        .substring(0, 100)
      const bookFolderName = `${bookId}-${sanitizedTitle}`

      logger.debug('Creating main book folder in shared drive root', {
        folderName: bookFolderName,
        sharedDriveId: this.sharedDriveId,
      })

      const bookFolder = await this.createFolder({
        name: bookFolderName,
        description: `Files for book: ${bookTitle} (ID: ${bookId})`,
      })

      logger.debug('Main book folder created', {
        folderId: bookFolder.id,
        folderName: bookFolder.name,
        parents: bookFolder.parents,
      })

      logger.info(`Created folder structure for book ${bookId}`)

      // Return just the main folder ID - subfolders will be created on-demand during file uploads
      return {
        folderId: bookFolder.id,
        subfolders: {}, // Empty since we're not pre-creating subfolders
      }
    } catch (error) {
      logger.error('Failed to create book folder structure', {
        bookId,
        bookTitle,
        error,
      })
      throw new GeneralError(
        `Failed to create folder structure for book ${bookId}`,
      )
    }
  }
}
