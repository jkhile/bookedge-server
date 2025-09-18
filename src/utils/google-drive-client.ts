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
   * Create a GoogleDriveClient using service account credentials
   */
  static async createServiceAccountClient(): Promise<GoogleDriveClient> {
    try {
      const serviceAccountJson = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT
      if (!serviceAccountJson) {
        throw new GeneralError(
          'Google Drive service account credentials not configured',
        )
      }

      const serviceAccount = JSON.parse(serviceAccountJson)

      // Create JWT client for service account
      const auth = new google.auth.JWT({
        email: serviceAccount.client_email,
        key: serviceAccount.private_key,
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive.metadata',
        ],
      })

      await auth.authorize()
      logger.info('Google Drive service account client created successfully')

      // Get or create the shared drive
      const sharedDriveId = await GoogleDriveClient.getOrCreateSharedDrive(auth)

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
   * Get or create the BookEdge shared drive
   */
  private static async getOrCreateSharedDrive(
    auth: OAuth2Client,
  ): Promise<string> {
    const drive = google.drive({ version: 'v3', auth })
    const rootFolderName =
      process.env.GOOGLE_DRIVE_ROOT_FOLDER || 'FEP_BookEdge'

    try {
      // First, try to find existing shared drive
      const drivesList = await drive.drives.list({
        pageSize: 100,
        fields: 'drives(id, name)',
      })

      const existingDrive = drivesList.data.drives?.find(
        (d) => d.name === rootFolderName,
      )

      if (existingDrive?.id) {
        logger.info(`Found existing shared drive: ${rootFolderName}`)
        return existingDrive.id
      }

      // If not found, create the root folder in My Drive instead
      // (Creating shared drives requires Google Workspace admin permissions)
      const folderResponse = await drive.files.create({
        requestBody: {
          name: rootFolderName,
          mimeType: MIME_TYPES.FOLDER,
        },
        fields: 'id',
      })

      if (!folderResponse.data.id) {
        throw new GeneralError('Failed to create root folder')
      }

      logger.info(`Created root folder: ${rootFolderName}`)
      return folderResponse.data.id
    } catch (error) {
      logger.error('Failed to get or create shared drive', error)
      throw error
    }
  }

  /**
   * Create a folder in Google Drive
   */
  async createFolder(options: CreateFolderOptions): Promise<DriveFile> {
    try {
      const fileMetadata: drive_v3.Schema$File = {
        name: options.name,
        mimeType: MIME_TYPES.FOLDER,
        parents: options.parentId
          ? [options.parentId]
          : this.sharedDriveId
            ? [this.sharedDriveId]
            : undefined,
        description: options.description,
      }

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name, mimeType, parents, createdTime, modifiedTime',
        supportsAllDrives: true,
      })

      if (!response.data.id) {
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

      if (!response.data.id) {
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
      // Create main book folder
      const sanitizedTitle = bookTitle
        .replace(/[<>:"/\\|?*]/g, '_')
        .substring(0, 100)
      const bookFolderName = `${bookId}_${sanitizedTitle}`

      const bookFolder = await this.createFolder({
        name: bookFolderName,
        description: `Files for book: ${bookTitle} (ID: ${bookId})`,
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
        const subfolder = await this.createFolder({
          name: folderName,
          parentId: bookFolder.id,
          description: `${folderName} files for ${bookTitle}`,
        })
        subfolders[folderName] = subfolder.id
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
