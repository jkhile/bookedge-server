import { google, drive_v3 } from 'googleapis'
import type { OAuth2Client } from 'google-auth-library'
import { GeneralError, BadRequest } from '@feathersjs/errors'
import { logger } from '../logger'

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

      const response = await this.drive.files.list({
        q: query,
        pageSize: options.pageSize || 100,
        pageToken: options.pageToken,
        orderBy: options.orderBy || 'modifiedTime desc',
        fields:
          'nextPageToken, files(id, name, mimeType, size, parents, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      })

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
  async getFile(fileId: string): Promise<DriveFile> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields:
          'id, name, mimeType, size, parents, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink',
        supportsAllDrives: true,
      })

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        size: response.data.size || undefined,
        parents: response.data.parents || [],
        createdTime: response.data.createdTime || undefined,
        modifiedTime: response.data.modifiedTime || undefined,
        webViewLink: response.data.webViewLink || undefined,
        webContentLink: response.data.webContentLink || undefined,
        thumbnailLink: response.data.thumbnailLink || undefined,
      }
    } catch (error) {
      logger.error('Failed to get file', { fileId, error })
      throw new BadRequest(`File not found: ${fileId}`)
    }
  }

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

      // Create main book folder
      const sanitizedTitle = bookTitle
        .replace(/[<>:"/\\|?*]/g, '_')
        .substring(0, 100)
      const bookFolderName = `${bookId}_${sanitizedTitle}`

      logger.debug('Creating main book folder', {
        folderName: bookFolderName,
        parentId: this.sharedDriveId,
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

      // Create standard subfolders
      const subfolderNames = [
        'cover',
        'interior',
        'marketing',
        'editorial',
        'production',
        'archives',
      ]
      const subfolders: Record<string, string> = {}

      for (const folderName of subfolderNames) {
        logger.debug('Creating subfolder', {
          name: folderName,
          parentId: bookFolder.id,
        })
        const subfolder = await this.createFolder({
          name: folderName,
          parentId: bookFolder.id,
          description: `${folderName} files for ${bookTitle}`,
        })
        subfolders[folderName] = subfolder.id
        logger.debug('Subfolder created', {
          name: folderName,
          id: subfolder.id,
        })
      }

      logger.info(`Created folder structure for book ${bookId}`)

      return {
        folderId: bookFolder.id,
        subfolders,
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
