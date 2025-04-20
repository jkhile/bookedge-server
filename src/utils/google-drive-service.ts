import { google } from 'googleapis'
import { JWT } from 'google-auth-library'
import { createReadStream, createWriteStream } from 'fs'
import { join } from 'path'
import { logger } from '../logger'
import { promisify } from 'util'
import { pipeline } from 'stream'
import { tmpdir } from 'os'
import fs from 'fs/promises'

const streamPipeline = promisify(pipeline)

// Constants
const MIME_TYPES = {
  FOLDER: 'application/vnd.google-apps.folder',
  PDF: 'application/pdf',
  DOC: 'application/vnd.google-apps.document',
  SHEET: 'application/vnd.google-apps.spreadsheet',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
}

/**
 * Google Drive file metadata
 */
export interface DriveFile {
  id: string
  name: string
  mimeType: string
  webViewLink?: string | null
  thumbnailLink?: string | null
  webContentLink?: string | null
  modifiedTime?: string | null
  size?: string | null
  parents?: string[] | null
  description?: string | null
}

/**
 * Options for file upload
 */
export interface UploadOptions {
  /** Parent folder ID to upload the file to */
  folderId: string
  /** Name to give the file in Google Drive */
  name: string
  /** Optional description for the file */
  description?: string
  /** Optional MIME type, will be auto-determined if not specified */
  mimeType?: string
}

/**
 * Google Drive service configuration
 */
export interface GoogleDriveServiceConfig {
  /** Path to service account credentials file or JSON credentials string */
  credentials: string
  /** Root folder name for Bookedge in Google Drive */
  rootFolderName: string
  /** Google workspace domain for which to create shared drives/folders */
  workspaceDomain: string
}

/**
 * Google Drive utility service for BookEdge
 */
export class GoogleDriveService {
  private auth: JWT | null = null
  private drive: ReturnType<typeof google.drive> | null = null
  private rootFolderId: string | null = null
  private rootFolderName: string
  private workspaceDomain: string

  /**
   * Creates a new GoogleDriveService instance
   *
   * @param config Configuration for the service
   */
  constructor(private config: GoogleDriveServiceConfig) {
    this.rootFolderName = config.rootFolderName
    this.workspaceDomain = config.workspaceDomain
  }

  /**
   * Initialize the Google Drive client with service account credentials
   */
  async initialize(): Promise<void> {
    try {
      let credentials: any

      // Check if credentials is a file path or JSON string
      if (this.config.credentials.trim().startsWith('{')) {
        credentials = JSON.parse(this.config.credentials)
      } else {
        const credentialsFile = await fs.readFile(
          this.config.credentials,
          'utf-8',
        )
        credentials = JSON.parse(credentialsFile)
      }

      this.auth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file',
        ],
        subject: credentials.subject_email || undefined,
      })

      this.drive = google.drive({ version: 'v3', auth: this.auth })

      // Make sure the root folder exists
      await this.ensureRootFolder()

      logger.info('Google Drive service initialized successfully', {
        workspaceDomain: this.workspaceDomain,
        rootFolder: this.rootFolderName,
        rootFolderId: this.rootFolderId,
      })
    } catch (error) {
      logger.error('Failed to initialize Google Drive service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw new Error(
        `Failed to initialize Google Drive service: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Create the root folder for BookEdge if it doesn't exist
   */
  private async ensureRootFolder(): Promise<void> {
    if (!this.drive) {
      throw new Error('Drive client not initialized')
    }

    try {
      // First check if the root folder already exists
      const response = await this.drive.files.list({
        q: `mimeType='${MIME_TYPES.FOLDER}' and name='${this.rootFolderName}' and trashed=false`,
        fields: 'files(id, name, parents)',
      })

      if (response.data.files && response.data.files.length > 0) {
        this.rootFolderId = response.data.files[0].id!
        logger.info('Found existing root folder', {
          name: this.rootFolderName,
          id: this.rootFolderId,
        })
        return
      }

      // Create a new folder in the shared drive or team drives
      const folderMetadata = {
        name: this.rootFolderName,
        mimeType: MIME_TYPES.FOLDER,
        // If you have a shared drive/team drive ID, use it here
        // parents: ['sharedDriveId']
      }

      const folder = await this.drive.files.create({
        requestBody: folderMetadata,
        fields: 'id',
      })

      this.rootFolderId = folder.data.id!

      // Make the folder accessible to workspace users
      await this.drive.permissions.create({
        fileId: this.rootFolderId,
        requestBody: {
          role: 'writer',
          type: 'domain',
          domain: this.workspaceDomain,
        },
      })

      logger.info('Created new root folder', {
        name: this.rootFolderName,
        id: this.rootFolderId,
      })
    } catch (error) {
      logger.error('Failed to ensure root folder exists', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Get the ID of the root folder
   */
  getRootFolderId(): string {
    if (!this.rootFolderId) {
      throw new Error(
        'Root folder ID not available. Make sure to call initialize() first',
      )
    }
    return this.rootFolderId
  }

  /**
   * Create a new folder in Google Drive
   *
   * @param name Name of the folder
   * @param parentId Parent folder ID (defaults to root folder)
   * @returns The created folder metadata
   */
  async createFolder(name: string, parentId?: string): Promise<DriveFile> {
    if (!this.drive) {
      throw new Error('Drive client not initialized')
    }

    const folderId = parentId || this.rootFolderId
    if (!folderId) {
      throw new Error('Parent folder ID is required')
    }

    try {
      // Check if folder already exists
      const existing = await this.findFiles({
        q: `mimeType='${MIME_TYPES.FOLDER}' and name='${name}' and '${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, parents)',
      })

      if (existing.length > 0) {
        logger.info('Folder already exists', {
          name,
          id: existing[0].id,
          parentId: folderId,
        })
        return existing[0]
      }

      // Create a new folder
      const folderMetadata = {
        name,
        mimeType: MIME_TYPES.FOLDER,
        parents: [folderId],
      }

      const response = await this.drive.files.create({
        requestBody: folderMetadata,
        fields: 'id, name, mimeType, parents',
      })

      logger.info('Folder created successfully', {
        name,
        id: response.data.id,
        parentId: folderId,
      })

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        parents: response.data.parents,
      }
    } catch (error) {
      logger.error('Failed to create folder', {
        name,
        parentId: folderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Upload a file to Google Drive
   *
   * @param filePath Local path to the file
   * @param options Upload options
   * @returns The uploaded file metadata
   */
  async uploadFile(
    filePath: string,
    options: UploadOptions,
  ): Promise<DriveFile> {
    if (!this.drive) {
      throw new Error('Drive client not initialized')
    }

    try {
      const fileMetadata = {
        name: options.name,
        parents: [options.folderId],
        description: options.description,
      }

      const media = {
        body: createReadStream(filePath),
      }

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        fields:
          'id, name, mimeType, webViewLink, thumbnailLink, webContentLink, modifiedTime, size',
      })

      logger.info('File uploaded successfully', {
        name: options.name,
        id: response.data.id,
        folderId: options.folderId,
      })

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        webViewLink: response.data.webViewLink,
        thumbnailLink: response.data.thumbnailLink,
        webContentLink: response.data.webContentLink,
        modifiedTime: response.data.modifiedTime,
        size: response.data.size,
      }
    } catch (error) {
      logger.error('Failed to upload file', {
        filePath,
        name: options.name,
        folderId: options.folderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Upload file content directly to Google Drive
   *
   * @param content File content as a Buffer or string
   * @param options Upload options
   * @returns The uploaded file metadata
   */
  async uploadContent(
    content: Buffer | string,
    options: UploadOptions,
  ): Promise<DriveFile> {
    if (!this.drive) {
      throw new Error('Drive client not initialized')
    }

    // Create a temporary file
    const tempFilePath = join(
      tmpdir(),
      `bookedge-${Date.now()}-${options.name}`,
    )

    try {
      // Write content to temporary file
      if (typeof content === 'string') {
        await fs.writeFile(tempFilePath, content, 'utf-8')
      } else {
        await fs.writeFile(tempFilePath, content)
      }

      // Upload the temporary file
      const result = await this.uploadFile(tempFilePath, options)

      return result
    } catch (error) {
      logger.error('Failed to upload content', {
        name: options.name,
        folderId: options.folderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    } finally {
      // Clean up the temporary file
      try {
        await fs.unlink(tempFilePath)
      } catch (err) {
        logger.warn('Failed to delete temporary file', {
          path: tempFilePath,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }
  }

  /**
   * Download a file from Google Drive
   *
   * @param fileId ID of the file to download
   * @param destinationPath Local path to save the file to
   * @returns The path to the downloaded file
   */
  async downloadFile(fileId: string, destinationPath: string): Promise<string> {
    if (!this.drive) {
      throw new Error('Drive client not initialized')
    }

    try {
      const response = await this.drive.files.get(
        {
          fileId,
          alt: 'media',
        },
        { responseType: 'stream' },
      )

      await streamPipeline(response.data, createWriteStream(destinationPath))

      logger.info('File downloaded successfully', {
        fileId,
        destinationPath,
      })

      return destinationPath
    } catch (error) {
      logger.error('Failed to download file', {
        fileId,
        destinationPath,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Get metadata for a file
   *
   * @param fileId ID of the file
   * @returns File metadata
   */
  async getFile(fileId: string): Promise<DriveFile> {
    if (!this.drive) {
      throw new Error('Drive client not initialized')
    }

    try {
      const response = await this.drive.files.get({
        fileId,
        fields:
          'id, name, mimeType, webViewLink, thumbnailLink, webContentLink, modifiedTime, size, parents, description',
      })

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        webViewLink: response.data.webViewLink,
        thumbnailLink: response.data.thumbnailLink,
        webContentLink: response.data.webContentLink,
        modifiedTime: response.data.modifiedTime,
        size: response.data.size,
        parents: response.data.parents,
        description: response.data.description,
      }
    } catch (error) {
      logger.error('Failed to get file metadata', {
        fileId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * List files and folders in a directory
   *
   * @param folderId ID of the folder to list content from (defaults to root folder)
   * @returns Array of files and folders
   */
  async listFiles(folderId?: string): Promise<DriveFile[]> {
    const dirId = folderId || this.rootFolderId
    if (!dirId) {
      throw new Error('Folder ID is required')
    }

    return this.findFiles({
      q: `'${dirId}' in parents and trashed=false`,
      fields:
        'files(id, name, mimeType, webViewLink, thumbnailLink, webContentLink, modifiedTime, size)',
    })
  }

  /**
   * Search for files in Google Drive
   *
   * @param params Search parameters
   * @returns Array of matching files
   */
  async findFiles(params: {
    q: string
    fields?: string
    pageSize?: number
    orderBy?: string
  }): Promise<DriveFile[]> {
    if (!this.drive) {
      throw new Error('Drive client not initialized')
    }

    try {
      const response = await this.drive.files.list({
        q: params.q,
        fields: `nextPageToken, ${params.fields || 'files(id, name, mimeType, webViewLink, thumbnailLink)'}`,
        pageSize: params.pageSize || 1000,
        orderBy: params.orderBy || 'modifiedTime desc',
      })

      return (response.data.files || []).map((file) => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        webViewLink: file.webViewLink,
        thumbnailLink: file.thumbnailLink,
        webContentLink: file.webContentLink,
        modifiedTime: file.modifiedTime,
        size: file.size,
        parents: file.parents,
        description: file.description,
      }))
    } catch (error) {
      logger.error('Failed to find files', {
        query: params.q,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Delete a file or folder
   *
   * @param fileId ID of the file or folder to delete
   * @returns True if deleted successfully
   */
  async deleteFile(fileId: string): Promise<boolean> {
    if (!this.drive) {
      throw new Error('Drive client not initialized')
    }

    try {
      await this.drive.files.delete({ fileId })

      logger.info('File deleted successfully', { fileId })
      return true
    } catch (error) {
      logger.error('Failed to delete file', {
        fileId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Retrieve a thumbnail image for a file
   *
   * @param fileId ID of the file
   * @param size Size of the thumbnail (default: medium)
   * @returns The thumbnail URL or null if not available
   */
  async getThumbnail(
    fileId: string,
    size: 'small' | 'medium' | 'large' = 'medium',
  ): Promise<string | null> {
    try {
      const file = await this.getFile(fileId)

      if (!file.thumbnailLink) {
        return null
      }

      // Google Drive thumbnail URLs support size parameters
      let thumbnailUrl = file.thumbnailLink

      // Adjust size parameter in the URL (s=XXX)
      if (size === 'small') {
        thumbnailUrl = thumbnailUrl.replace(/=s\d+/, '=s120')
      } else if (size === 'medium') {
        thumbnailUrl = thumbnailUrl.replace(/=s\d+/, '=s220')
      } else if (size === 'large') {
        thumbnailUrl = thumbnailUrl.replace(/=s\d+/, '=s400')
      }

      return thumbnailUrl
    } catch (error) {
      logger.error('Failed to get thumbnail', {
        fileId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return null
    }
  }

  /**
   * Move a file to a different folder
   *
   * @param fileId ID of the file to move
   * @param targetFolderId ID of the destination folder
   * @param removeFromSource Whether to remove the file from its original location
   * @returns Updated file metadata
   */
  async moveFile(
    fileId: string,
    targetFolderId: string,
    removeFromSource: boolean = true,
  ): Promise<DriveFile> {
    if (!this.drive) {
      throw new Error('Drive client not initialized')
    }

    try {
      // Get current parents
      const file = await this.getFile(fileId)
      const currentParents = file.parents || []

      const requestBody: any = {
        addParents: [targetFolderId],
      }

      // If removeFromSource is true, remove all existing parents
      if (removeFromSource && currentParents.length > 0) {
        requestBody.removeParents = currentParents.join(',')
      }

      // Update the file's parents
      const response = await this.drive.files.update({
        fileId,
        requestBody,
        fields: 'id, name, mimeType, parents',
      })

      logger.info('File moved successfully', {
        fileId,
        targetFolderId,
        removeFromSource,
      })

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        parents: response.data.parents,
      }
    } catch (error) {
      logger.error('Failed to move file', {
        fileId,
        targetFolderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Update file metadata
   *
   * @param fileId ID of the file to update
   * @param metadata Metadata to update
   * @returns Updated file metadata
   */
  async updateFile(
    fileId: string,
    metadata: {
      name?: string
      description?: string
      [key: string]: any
    },
  ): Promise<DriveFile> {
    if (!this.drive) {
      throw new Error('Drive client not initialized')
    }

    try {
      const response = await this.drive.files.update({
        fileId,
        requestBody: metadata,
        fields: 'id, name, mimeType, webViewLink, description, modifiedTime',
      })

      logger.info('File metadata updated successfully', {
        fileId,
        updatedFields: Object.keys(metadata),
      })

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        webViewLink: response.data.webViewLink,
        modifiedTime: response.data.modifiedTime,
        description: response.data.description,
      }
    } catch (error) {
      logger.error('Failed to update file metadata', {
        fileId,
        metadata,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Create or update file permissions
   *
   * @param fileId ID of the file
   * @param permission Permission to add
   * @returns Permission ID
   */
  async setPermission(
    fileId: string,
    permission: {
      role: 'reader' | 'writer' | 'commenter' | 'owner'
      type: 'user' | 'group' | 'domain' | 'anyone'
      emailAddress?: string
      domain?: string
    },
  ): Promise<string> {
    if (!this.drive) {
      throw new Error('Drive client not initialized')
    }

    try {
      const response = await this.drive.permissions.create({
        fileId,
        requestBody: permission,
        fields: 'id',
      })

      logger.info('Permission added successfully', {
        fileId,
        permission,
        permissionId: response.data.id,
      })

      return response.data.id!
    } catch (error) {
      logger.error('Failed to set permission', {
        fileId,
        permission,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Get file content as a string
   *
   * @param fileId ID of the file
   * @returns File content as a string
   */
  async getFileContent(fileId: string): Promise<string> {
    if (!this.drive) {
      throw new Error('Drive client not initialized')
    }

    const tempFile = join(tmpdir(), `bookedge-tmp-${Date.now()}`)

    try {
      await this.downloadFile(fileId, tempFile)
      const content = await fs.readFile(tempFile, 'utf8')
      return content
    } catch (error) {
      logger.error('Failed to get file content', {
        fileId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tempFile)
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Get file content as a buffer
   *
   * @param fileId ID of the file
   * @returns File content as a buffer
   */
  async getFileBuffer(fileId: string): Promise<Buffer> {
    if (!this.drive) {
      throw new Error('Drive client not initialized')
    }

    const tempFile = join(tmpdir(), `bookedge-tmp-${Date.now()}`)

    try {
      await this.downloadFile(fileId, tempFile)
      const content = await fs.readFile(tempFile)
      return content
    } catch (error) {
      logger.error('Failed to get file buffer', {
        fileId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tempFile)
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Create a Google Drive service instance from application configuration
 *
 * Required configuration values:
 * - config.googleDrive.serviceAccount: Path to service account JSON file or JSON string
 * - config.googleDrive.rootFolder: Name of the root folder in Google Drive
 * - config.googleDrive.workspaceDomain: Google Workspace domain (e.g., frontedgepublishing.com)
 */
export const createGoogleDriveService = async (
  app: any,
): Promise<GoogleDriveService> => {
  const config = app.get('googleDrive') || {}
  const serviceAccountCredentials = config.serviceAccount
  const rootFolderName = config.rootFolder || 'BookEdge'
  const workspaceDomain = config.workspaceDomain || 'frontedgepublishing.com'

  if (!serviceAccountCredentials) {
    throw new Error('Google Drive service account credentials are required')
  }

  const service = new GoogleDriveService({
    credentials: serviceAccountCredentials,
    rootFolderName,
    workspaceDomain,
  })

  await service.initialize()
  return service
}

// Export the composable
export const useGoogleDrive = (app: any) => {
  let serviceInstance: GoogleDriveService | null = null

  /**
   * Get or create the Google Drive service instance
   */
  const getService = async (): Promise<GoogleDriveService> => {
    if (!serviceInstance) {
      serviceInstance = await createGoogleDriveService(app)
    }
    return serviceInstance
  }

  return {
    getService,
    createGoogleDriveService: async () => createGoogleDriveService(app),
  }
}
