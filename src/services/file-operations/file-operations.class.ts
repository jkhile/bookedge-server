import { BadRequest, NotFound } from '@feathersjs/errors'
import type { Id, NullableId, Params } from '@feathersjs/feathers'
import { logger } from '../../logger'
import type { Application } from '../../declarations'
import { GoogleDriveManager } from '../../utils/google-drive-manager'
import { toReadableStream } from '../../utils/stream-helpers'
import type { Book } from '../books/books.schema'
import { getUploadSessionManager } from '../../utils/upload-session-manager'
import {
  generateThumbnail,
  isSupportedFileType,
} from '../../utils/thumbnail-generator'

// Purpose to book column mapping
const PURPOSE_TO_COLUMN: Record<string, keyof Book> = {
  cover: 'cover_file',
  interior: 'interior_file',
  marketing: 'media_kit_link',
  media_kit: 'media_kit_link',
  discussion_guide: 'discussion_guide_link',
  'book-trailer': 'book_trailer_link',
  book_trailer: 'book_trailer_link',
  'cover-reveal': 'cover_reveal_link',
  cover_reveal: 'cover_reveal_link',
  'media-list': 'media_list',
  media_list: 'media_list',
}

// Purpose to filename column mapping
const PURPOSE_TO_FILENAME_COLUMN: Record<string, keyof Book> = {
  interior: 'interior_file_name',
  media_kit: 'media_kit_file_name',
  discussion_guide: 'discussion_guide_file_name',
  'book-trailer': 'book_trailer_file_name',
  book_trailer: 'book_trailer_file_name',
  'cover-reveal': 'cover_reveal_file_name',
  cover_reveal: 'cover_reveal_file_name',
  'media-list': 'media_list_file_name',
  media_list: 'media_list_file_name',
}

// Helper to extract file ID from Google Drive URL
function extractDriveFileId(url: string): string | null {
  if (!url) return null
  // Match various Google Drive URL formats
  // https://drive.google.com/file/d/FILE_ID/view
  // https://drive.google.com/open?id=FILE_ID
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    /\/open\?id=([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

// Simple interfaces for our operations
export interface FileUploadData {
  bookId: number
  purpose: string
  file: {
    name: string
    type: string
    size: number
    data: string // base64 encoded
  }
}

export interface FileDownloadData {
  bookId: number
  purpose: string
}

export interface FileOperationResult {
  success: boolean
  fileId?: string
  fileName?: string
  webViewLink?: string
  webContentLink?: string
  bookId?: number
  purpose?: string
  data?: string // base64 for downloads
  url?: string // for large file downloads
  thumbnailData?: string // base64 thumbnail for images/PDFs
  thumbnailWidth?: number
  thumbnailHeight?: number
}

export interface FileListQuery {
  bookId: number
}

export interface FileListResult {
  bookId: number
  files: Array<{
    purpose: string
    url: string | null
    fileId: string | null
    fileName?: string
  }>
}

// Chunked transfer interfaces (simplified)
export interface ChunkUploadInitData {
  bookId: number
  purpose: string
  file: {
    name: string
    type: string
    size: number
  }
}

export interface ChunkUploadData {
  uploadId: string
  chunkIndex: number
  totalChunks: number
  data: string // base64 chunk
}

export interface ChunkUploadInitResult {
  uploadId: string
  chunkSize: number
  totalChunks: number
}

export interface ChunkUploadResult {
  progress: number
  complete: boolean
  receivedChunks: number
  totalChunks: number
}

export interface ChunkDownloadInitResult {
  downloadId?: string
  totalChunks: number
  chunkSize: number
  fileName?: string
  fileSize?: number
}

export interface ChunkDownloadRequest {
  downloadId: string
  chunkIndex: number
}

export interface ChunkDownloadResult {
  data: string
  chunkIndex: number
  totalChunks: number
  complete: boolean
}

// Download session for tracking active downloads
interface DownloadSession {
  id: string
  bookId: number
  purpose: string
  fileId: string
  fileName: string
  fileSize: number
  chunkSize: number
  totalChunks: number
  lastChunkSent: number
  createdAt: Date
  lastActivityAt: Date
  userId: number
  cancelled?: boolean
}

// Export for backward compatibility
export type FileOperationsParams = Params

// Add interface for download init data
export interface ChunkDownloadInitData {
  bookId: number
  purpose: string
}

// Export interfaces for service methods
export interface FileOperationsServiceMethods {
  find(params?: Params): Promise<FileListResult>
  get(id: Id, params?: Params): Promise<FileOperationResult>
  create(data: FileUploadData, params?: Params): Promise<FileOperationResult>
  update(id: NullableId, data: any, params?: Params): Promise<any>
  patch(id: NullableId, data: any, params?: Params): Promise<any>
  remove(id: NullableId, params?: Params): Promise<FileOperationResult>
  upload(data: FileUploadData, params?: Params): Promise<FileOperationResult>
  download(id: Id, params?: Params): Promise<FileOperationResult>
  move(data: any, params?: Params): Promise<any>
  gallery(data: any, params?: Params): Promise<any>
  getShareLink(id: Id, params?: Params): Promise<any>
  uploadChunkInit(
    data: ChunkUploadInitData,
    params?: Params,
  ): Promise<ChunkUploadInitResult>
  uploadChunk(
    data: ChunkUploadData,
    params?: Params,
  ): Promise<ChunkUploadResult>
  uploadChunkComplete(
    uploadId: string,
    params?: Params,
  ): Promise<FileOperationResult>
  uploadChunkCancel(uploadId: string, params?: Params): Promise<void>
  downloadChunkInit(
    data: ChunkDownloadInitData,
    params?: Params,
  ): Promise<ChunkDownloadInitResult>
  downloadChunk(
    request: ChunkDownloadRequest,
    params?: Params,
  ): Promise<ChunkDownloadResult>
  downloadChunkCancel(downloadId: string, params?: Params): Promise<void>
}

export class FileOperationsService implements FileOperationsServiceMethods {
  app: Application
  driveManager: GoogleDriveManager
  private downloadSessions: Map<string, DownloadSession> = new Map()
  private downloadCleanupInterval: NodeJS.Timeout | null = null

  constructor(app: Application) {
    this.app = app
    this.driveManager = GoogleDriveManager.getInstance(app)
    this.startDownloadCleanup()
  }

  /**
   * List all files for a book
   */
  async find(params: Params): Promise<FileListResult> {
    const query = params.query || {}
    const bookId = query.bookId

    if (!bookId) {
      throw new BadRequest('bookId is required')
    }

    // Get the book
    const book = await this.app.service('books').get(bookId)

    // Build list of files from book columns
    const files = []

    for (const [purpose, column] of Object.entries(PURPOSE_TO_COLUMN)) {
      const url = book[column] as string
      if (url) {
        files.push({
          purpose,
          url,
          fileId: extractDriveFileId(url),
        })
      }
    }

    return {
      bookId,
      files,
    }
  }

  /**
   * Get file info
   */
  async get(id: Id, _params: Params): Promise<FileOperationResult> {
    // id should be in format: bookId-purpose
    const [bookId, purpose] = String(id).split('-')

    if (!bookId || !purpose) {
      throw new BadRequest('Invalid file ID format. Use: bookId-purpose')
    }

    const book = await this.app.service('books').get(parseInt(bookId))
    const column = PURPOSE_TO_COLUMN[purpose]

    if (!column) {
      throw new BadRequest(`Invalid purpose: ${purpose}`)
    }

    const url = book[column] as string
    if (!url) {
      throw new NotFound(`No ${purpose} file found for book ${bookId}`)
    }

    return {
      success: true,
      fileId: extractDriveFileId(url) || undefined,
      webViewLink: url,
      bookId: parseInt(bookId),
      purpose,
    }
  }

  /**
   * Upload a file (create)
   */
  async create(
    data: FileUploadData,
    params: Params,
  ): Promise<FileOperationResult> {
    return this.upload(data, params)
  }

  /**
   * Upload a file to Google Drive and update book
   */
  async upload(
    data: FileUploadData,
    params: Params,
  ): Promise<FileOperationResult> {
    try {
      const { bookId, purpose, file } = data

      logger.debug('Starting simplified upload', {
        bookId,
        purpose,
        fileName: file.name,
        fileSize: file.size,
        user: params.user?.email,
      })

      // Validate purpose
      const column = PURPOSE_TO_COLUMN[purpose]
      if (!column) {
        throw new BadRequest(
          `Invalid purpose: ${purpose}. Valid purposes: ${Object.keys(PURPOSE_TO_COLUMN).join(', ')}`,
        )
      }

      // Get the book
      const book = await this.app.service('books').get(bookId)

      // Convert base64 to Buffer
      const fileBuffer = Buffer.from(file.data, 'base64')

      // Get or create book folder in Google Drive
      let bookFolderId = book.drive_folder_id
      const driveClient = await this.driveManager.getServiceAccountClient()

      if (!bookFolderId) {
        logger.debug('Creating book folder in Google Drive', {
          bookId,
          title: book.title,
        })

        const folderStructure = await driveClient.createBookFolderStructure(
          bookId,
          book.title,
        )
        bookFolderId = folderStructure.folderId

        // Update book with folder ID
        await this.app.service('books').patch(bookId, {
          drive_folder_id: bookFolderId,
        })

        logger.debug('Book folder created', { bookFolderId })
      }

      // Get or create purpose subfolder
      const subfolders = await driveClient.listFiles({
        folderId: bookFolderId,
        query: `mimeType='application/vnd.google-apps.folder' and name='${purpose}'`,
      })

      let targetFolderId = bookFolderId
      if (subfolders.files.length > 0) {
        targetFolderId = subfolders.files[0].id
      } else {
        // Create subfolder
        const newFolder = await driveClient.createFolder({
          name: purpose,
          parentId: bookFolderId,
          description: `${purpose} files for ${book.title}`,
        })
        targetFolderId = newFolder.id
      }

      // Upload file to Google Drive
      const fileStream = toReadableStream(fileBuffer)
      const uploadResult = await driveClient.uploadFile({
        fileName: file.name,
        mimeType: file.type,
        folderId: targetFolderId,
        fileContent: fileStream,
        description: `${purpose} file for ${book.title}`,
      })

      logger.debug('File uploaded to Google Drive', {
        driveFileId: uploadResult.id,
        webViewLink: uploadResult.webViewLink,
      })

      // Generate thumbnail if it's an image or PDF
      let thumbnailData: string | undefined
      let thumbnailWidth: number | undefined
      let thumbnailHeight: number | undefined

      if (isSupportedFileType(file.type)) {
        try {
          const thumbnail = await generateThumbnail(fileBuffer, file.type)
          thumbnailData = thumbnail.data
          thumbnailWidth = thumbnail.width
          thumbnailHeight = thumbnail.height
          logger.info('Generated thumbnail for file', {
            fileName: file.name,
            thumbnailSize: thumbnail.data.length,
          })
        } catch (error) {
          logger.error('Failed to generate thumbnail', { error })
          // Continue without thumbnail
        }
      }

      // Update book with file URL and filename
      const filenameColumn = PURPOSE_TO_FILENAME_COLUMN[purpose]
      const patchData: any = {
        [column]: uploadResult.webViewLink,
      }
      if (filenameColumn) {
        patchData[filenameColumn] = uploadResult.name
      }
      await this.app.service('books').patch(bookId, patchData)

      logger.info(
        `File uploaded successfully: ${file.name} for book ${bookId} (${purpose})`,
      )

      return {
        success: true,
        fileId: uploadResult.id,
        fileName: uploadResult.name,
        webViewLink: uploadResult.webViewLink,
        webContentLink: uploadResult.webContentLink,
        bookId,
        purpose,
        thumbnailData,
        thumbnailWidth,
        thumbnailHeight,
      }
    } catch (error) {
      logger.error('Upload failed', error)
      throw error
    }
  }

  /**
   * Download a file from Google Drive
   */
  async download(id: Id, params: Params): Promise<FileOperationResult> {
    try {
      // Check if this is a direct Google Drive file ID (for gallery images)
      // Gallery file IDs are long alphanumeric strings without hyphens at certain positions
      const idStr = String(id)
      const isDriveFileId = idStr.length > 20 && !idStr.match(/^\d+-\w+$/)

      if (isDriveFileId) {
        // Download directly by Google Drive file ID (for gallery images)
        logger.debug('Starting direct download by file ID', { fileId: id })

        const driveClient = await this.driveManager.getServiceAccountClient()

        // Get file metadata first
        const fileMetadata = await driveClient.getFile(idStr)
        const fileSize = parseInt(fileMetadata.size || '0')

        // For files under 10MB, return base64 data
        const MAX_DIRECT_SIZE = 10 * 1024 * 1024 // 10MB

        if (fileSize <= MAX_DIRECT_SIZE) {
          const stream = await driveClient.downloadFile(idStr)

          // Convert stream to base64
          const chunks: Buffer[] = []

          return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
            stream.on('error', reject)
            stream.on('end', () => {
              const buffer = Buffer.concat(chunks)
              resolve({
                success: true,
                fileId: idStr,
                fileName: fileMetadata.name,
                data: buffer.toString('base64'),
              })
            })
          })
        } else {
          // For large files, return download URL
          return {
            success: true,
            fileId: idStr,
            fileName: fileMetadata.name,
            url: fileMetadata.webContentLink,
          }
        }
      }

      // Parse ID (format: bookId-purpose or just bookId with purpose in query)
      let bookId: number
      let purpose: string

      if (typeof id === 'string' && id.includes('-')) {
        const parts = id.split('-')
        bookId = parseInt(parts[0])
        purpose = parts[1]
      } else {
        bookId = typeof id === 'string' ? parseInt(id) : (id as number)
        purpose = params.query?.purpose
      }

      if (!purpose) {
        throw new BadRequest('Purpose is required for download')
      }

      logger.debug('Starting download', { bookId, purpose })

      // Get the book
      const book = await this.app.service('books').get(bookId)

      // Get the file URL from book
      const column = PURPOSE_TO_COLUMN[purpose]
      if (!column) {
        throw new BadRequest(`Invalid purpose: ${purpose}`)
      }

      const fileUrl = book[column] as string
      if (!fileUrl) {
        throw new NotFound(`No ${purpose} file found for book ${bookId}`)
      }

      // Extract file ID from URL
      const fileId = extractDriveFileId(fileUrl)
      if (!fileId) {
        throw new BadRequest('Invalid file URL in database')
      }

      // Download from Google Drive
      const driveClient = await this.driveManager.getServiceAccountClient()

      // Get file metadata first
      const fileMetadata = await driveClient.getFile(fileId)
      const fileSize = parseInt(fileMetadata.size || '0')

      // For files under 10MB, return base64 data
      const MAX_DIRECT_SIZE = 10 * 1024 * 1024 // 10MB

      if (fileSize <= MAX_DIRECT_SIZE) {
        const stream = await driveClient.downloadFile(fileId)

        // Convert stream to base64
        const chunks: Buffer[] = []

        return new Promise((resolve, reject) => {
          stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
          stream.on('error', reject)
          stream.on('end', () => {
            const buffer = Buffer.concat(chunks)
            resolve({
              success: true,
              fileId,
              fileName: fileMetadata.name,
              bookId,
              purpose,
              data: buffer.toString('base64'),
            })
          })
        })
      } else {
        // For large files, return download URL
        return {
          success: true,
          fileId,
          fileName: fileMetadata.name,
          bookId,
          purpose,
          url: fileMetadata.webContentLink,
        }
      }
    } catch (error) {
      logger.error('Download failed', error)
      throw error
    }
  }

  /**
   * Delete a file from Google Drive and clear book reference
   */
  async remove(id: NullableId, _params: Params): Promise<FileOperationResult> {
    if (!id) throw new BadRequest('File ID is required')

    try {
      // Parse ID (format: bookId-purpose)
      const [bookId, purpose] = String(id).split('-')

      if (!bookId || !purpose) {
        throw new BadRequest('Invalid file ID format. Use: bookId-purpose')
      }

      const column = PURPOSE_TO_COLUMN[purpose]
      if (!column) {
        throw new BadRequest(`Invalid purpose: ${purpose}`)
      }

      // Get the book
      const book = await this.app.service('books').get(parseInt(bookId))

      const fileUrl = book[column] as string
      if (!fileUrl) {
        throw new NotFound(`No ${purpose} file found for book ${bookId}`)
      }

      // Extract file ID from URL
      const fileId = extractDriveFileId(fileUrl)
      if (fileId) {
        // Delete from Google Drive
        const driveClient = await this.driveManager.getServiceAccountClient()
        await driveClient.deleteFile(fileId)
        logger.info(`Deleted file from Google Drive: ${fileId}`)
      }

      // Clear the field in books table
      await this.app.service('books').patch(parseInt(bookId), {
        [column]: '',
      })

      logger.info(`Cleared ${purpose} file reference for book ${bookId}`)

      return {
        success: true,
        fileId: fileId || undefined,
        bookId: parseInt(bookId),
        purpose,
      }
    } catch (error) {
      logger.error('Delete failed', error)
      throw error
    }
  }

  /**
   * Update not supported in simplified version
   */
  async update(): Promise<any> {
    throw new BadRequest('Update not supported. Use upload to replace files.')
  }

  /**
   * Patch not supported in simplified version
   */
  async patch(): Promise<any> {
    throw new BadRequest('Patch not supported. Use upload to replace files.')
  }

  // Keep these custom methods as stubs for now to maintain compatibility
  async move(_data: any, _params: Params): Promise<any> {
    throw new BadRequest('Move operation not supported in simplified version')
  }

  async gallery(_data: any, _params: Params): Promise<any> {
    throw new BadRequest(
      'Gallery operation not supported in simplified version',
    )
  }

  async getShareLink(id: Id, params: Params): Promise<any> {
    // This could be implemented simply by returning the webViewLink
    const result = await this.get(id, params)
    return {
      url: result.webViewLink,
    }
  }

  // ============= CHUNKED UPLOAD METHODS =============

  /**
   * Initialize a chunked upload session
   */
  async uploadChunkInit(
    data: ChunkUploadInitData,
    params: Params,
  ): Promise<ChunkUploadInitResult> {
    try {
      if (!params.user?.id) {
        throw new BadRequest('User authentication required')
      }

      const { bookId, purpose, file } = data

      // Validate purpose
      const column = PURPOSE_TO_COLUMN[purpose]
      if (!column) {
        throw new BadRequest(
          `Invalid purpose: ${purpose}. Valid purposes: ${Object.keys(PURPOSE_TO_COLUMN).join(', ')}`,
        )
      }

      // Get the book
      const book = await this.app.service('books').get(bookId)

      const config = this.app.get('fileTransfer')
      const chunkSize = config?.chunkSize || 1048576 // 1MB default
      const sessionTimeout = config?.sessionTimeout || 3600000 // 1 hour default

      const sessionManager = getUploadSessionManager(sessionTimeout)

      // Create upload session with simplified data
      const sessionData = {
        bookId,
        purpose,
        file,
        // These fields are kept for compatibility but not used
        description: `${purpose} file for ${book.title}`,
        finalized: false,
        metadata: {},
      }

      const { uploadId, totalChunks } = sessionManager.createSession(
        params.user.id,
        sessionData,
        chunkSize,
      )

      // Set up Google Drive resumable upload session
      try {
        // Get or create book folder
        let bookFolderId = book.drive_folder_id
        const driveClient = await this.driveManager.getServiceAccountClient()

        if (!bookFolderId) {
          const folderStructure = await driveClient.createBookFolderStructure(
            bookId,
            book.title,
          )
          bookFolderId = folderStructure.folderId

          await this.app.service('books').patch(bookId, {
            drive_folder_id: bookFolderId,
          })
        }

        // Get or create purpose subfolder
        const subfolders = await driveClient.listFiles({
          folderId: bookFolderId,
          query: `mimeType='application/vnd.google-apps.folder' and name='${purpose}'`,
        })

        let targetFolderId = bookFolderId
        if (subfolders.files.length > 0) {
          targetFolderId = subfolders.files[0].id
        } else {
          const newFolder = await driveClient.createFolder({
            name: purpose,
            parentId: bookFolderId,
            description: `${purpose} files for ${book.title}`,
          })
          targetFolderId = newFolder.id
        }

        // Initiate Google Drive resumable upload session
        const driveSessionUri = await driveClient.initiateResumableUpload({
          fileName: file.name,
          mimeType: file.type,
          folderId: targetFolderId,
          fileSize: file.size,
          description: `${purpose} file for ${book.title}`,
        })

        // Store the Drive session URI in the upload session
        sessionManager.setDriveSessionUri(uploadId, driveSessionUri)

        logger.info('Chunked upload initialized', {
          uploadId,
          bookId,
          purpose,
          fileName: file.name,
          fileSize: file.size,
          totalChunks,
        })
      } catch (error) {
        logger.error('Failed to initialize Drive resumable session', error)
        sessionManager.removeSession(uploadId)
        throw error
      }

      // Emit initialization event
      if (params.connection) {
        this.app.channel(`user/${params.user.id}`).send({
          type: 'upload-initialized',
          uploadId,
          bookId,
          purpose,
          totalChunks,
          chunkSize,
        })
      }

      return {
        uploadId,
        chunkSize,
        totalChunks,
      }
    } catch (error) {
      logger.error('Failed to initialize chunked upload', error)
      throw error
    }
  }

  /**
   * Receive and process a chunk
   */
  async uploadChunk(
    data: ChunkUploadData,
    params: Params,
  ): Promise<ChunkUploadResult> {
    try {
      const sessionManager = getUploadSessionManager()
      const session = sessionManager.getSession(data.uploadId)

      if (!session) {
        throw new NotFound(`Upload session not found: ${data.uploadId}`)
      }

      // Verify user owns this session
      if (session.userId !== params.user?.id) {
        throw new BadRequest('Unauthorized access to upload session')
      }

      // Convert base64 chunk to Buffer
      const chunkBuffer = Buffer.from(data.data, 'base64')

      // Store chunk in memory (for tracking and fallback)
      const progress = sessionManager.storeChunk(
        data.uploadId,
        data.chunkIndex,
        chunkBuffer,
      )

      const stats = sessionManager.getSessionStats(data.uploadId)
      let complete = sessionManager.isComplete(data.uploadId)
      let driveProgress = progress

      // Upload chunk directly to Google Drive if resumable session exists
      if (session.driveSessionUri) {
        try {
          const driveClient = await this.driveManager.getServiceAccountClient()
          const startByte =
            data.chunkIndex * (session.chunkSize || chunkBuffer.length)

          const uploadResult = await driveClient.uploadChunkToSession(
            session.driveSessionUri,
            chunkBuffer,
            startByte,
            session.totalBytes,
          )

          sessionManager.updateDriveProgress(
            data.uploadId,
            startByte + chunkBuffer.length,
            uploadResult.fileId,
          )

          driveProgress = uploadResult.progress
          complete = uploadResult.complete
        } catch (error) {
          logger.error('Failed to upload chunk to Drive', {
            uploadId: data.uploadId,
            chunkIndex: data.chunkIndex,
            error,
          })
          // Continue - we have the chunk in memory as fallback
        }
      }

      // Emit progress event
      if (params.connection) {
        this.app.channel(`user/${params.user?.id}`).send({
          type: 'upload-progress',
          uploadId: data.uploadId,
          progress: driveProgress,
          chunkIndex: data.chunkIndex,
          totalChunks: data.totalChunks,
          receivedChunks: stats?.receivedChunks || 0,
          complete,
        })
      }

      return {
        progress: driveProgress,
        complete,
        receivedChunks: stats?.receivedChunks || 0,
        totalChunks: stats?.totalChunks || 0,
      }
    } catch (error) {
      logger.error('Failed to process chunk', error)
      throw error
    }
  }

  /**
   * Complete the chunked upload and save URL to books table
   */
  async uploadChunkComplete(
    uploadId: string,
    params: Params,
  ): Promise<FileOperationResult> {
    try {
      const sessionManager = getUploadSessionManager()
      const session = sessionManager.getSession(uploadId)

      if (!session) {
        throw new NotFound(`Upload session not found: ${uploadId}`)
      }

      // Verify user owns this session
      if (session.userId !== params.user?.id) {
        throw new BadRequest('Unauthorized access to upload session')
      }

      // Verify all chunks received
      if (!sessionManager.isComplete(uploadId)) {
        throw new BadRequest('Not all chunks have been received')
      }

      const { bookId, purpose, file } = session.fileMetadata

      logger.info('Completing chunked upload', {
        uploadId,
        bookId,
        purpose,
        fileName: file.name,
      })

      // Get book for metadata
      const book = await this.app.service('books').get(bookId)
      const driveClient = await this.driveManager.getServiceAccountClient()

      let uploadResult: {
        id: string
        name: string
        mimeType: string
        size?: string
        webViewLink?: string
        webContentLink?: string
      }

      // Check if file was already uploaded via resumable upload
      if (session.driveFileId) {
        // File already uploaded to Drive - just get the details
        uploadResult = await driveClient.getFile(session.driveFileId)
      } else {
        // Fallback: assemble chunks and upload using traditional method
        logger.info('Using fallback upload method', { uploadId })

        // Get or create book folder
        let bookFolderId = book.drive_folder_id
        if (!bookFolderId) {
          const folderStructure = await driveClient.createBookFolderStructure(
            bookId,
            book.title,
          )
          bookFolderId = folderStructure.folderId

          await this.app.service('books').patch(bookId, {
            drive_folder_id: bookFolderId,
          })
        }

        // Get or create purpose subfolder
        const subfolders = await driveClient.listFiles({
          folderId: bookFolderId,
          query: `mimeType='application/vnd.google-apps.folder' and name='${purpose}'`,
        })

        let targetFolderId = bookFolderId
        if (subfolders.files.length > 0) {
          targetFolderId = subfolders.files[0].id
        } else {
          const newFolder = await driveClient.createFolder({
            name: purpose,
            parentId: bookFolderId,
            description: `${purpose} files for ${book.title}`,
          })
          targetFolderId = newFolder.id
        }

        // Assemble chunks and upload
        const fileContent = sessionManager.assembleChunks(uploadId)

        uploadResult = await driveClient.uploadFile({
          fileName: file.name,
          mimeType: file.type,
          folderId: targetFolderId,
          fileContent,
          description: `${purpose} file for ${book.title}`,
        })
      }

      // Update book with file URL and filename
      const column = PURPOSE_TO_COLUMN[purpose]
      if (column) {
        const filenameColumn = PURPOSE_TO_FILENAME_COLUMN[purpose]
        const patchData: any = {
          [column]: uploadResult.webViewLink,
        }
        if (filenameColumn) {
          patchData[filenameColumn] = uploadResult.name
        }
        await this.app.service('books').patch(bookId, patchData)
      }

      // Clean up session
      sessionManager.removeSession(uploadId)

      logger.info('Chunked upload completed', {
        uploadId,
        bookId,
        purpose,
        fileName: uploadResult.name,
        driveFileId: uploadResult.id,
      })

      // Emit completion event
      if (params.connection) {
        this.app.channel(`user/${params.user?.id}`).send({
          type: 'upload-complete',
          uploadId,
          bookId,
          purpose,
          fileId: uploadResult.id,
          fileName: uploadResult.name,
          webViewLink: uploadResult.webViewLink,
        })
      }

      return {
        success: true,
        fileId: uploadResult.id,
        fileName: uploadResult.name,
        webViewLink: uploadResult.webViewLink,
        webContentLink: uploadResult.webContentLink,
        bookId,
        purpose,
      }
    } catch (error) {
      logger.error('Failed to complete chunked upload', error)
      throw error
    }
  }

  /**
   * Cancel a chunked upload session
   */
  async uploadChunkCancel(uploadId: string, params: Params): Promise<void> {
    try {
      const sessionManager = getUploadSessionManager()
      const session = sessionManager.getSession(uploadId)

      if (!session) {
        // Session already gone, nothing to do
        return
      }

      // Verify user owns this session
      if (session.userId !== params.user?.id) {
        throw new BadRequest('Unauthorized access to upload session')
      }

      sessionManager.removeSession(uploadId)

      logger.info('Chunked upload cancelled', {
        uploadId,
        userId: params.user?.id,
        fileName: session.fileMetadata.file.name,
      })

      // Emit cancellation event
      if (params.connection) {
        this.app.channel(`user/${params.user?.id}`).send({
          type: 'upload-cancelled',
          uploadId,
        })
      }
    } catch (error) {
      logger.error('Failed to cancel chunked upload', error)
      throw error
    }
  }

  // ============= CHUNKED DOWNLOAD METHODS =============

  /**
   * Initialize a chunked download
   */
  async downloadChunkInit(
    data: ChunkDownloadInitData,
    params: Params,
  ): Promise<ChunkDownloadInitResult> {
    try {
      const { bookId, purpose } = data

      logger.info('downloadChunkInit called', {
        bookId,
        purpose,
        hasParams: !!params,
        hasUser: !!params?.user,
        userId: params?.user?.id,
        paramKeys: params ? Object.keys(params) : [],
      })

      if (!params?.user?.id) {
        logger.error('No user in params', {
          params: JSON.stringify(params, null, 2),
          data,
        })
        throw new BadRequest('User authentication required')
      }

      // Validate purpose
      const column = PURPOSE_TO_COLUMN[purpose]
      if (!column) {
        throw new BadRequest(`Invalid purpose: ${purpose}`)
      }

      // Get the book
      const book = await this.app.service('books').get(bookId)

      const fileUrl = book[column] as string
      if (!fileUrl) {
        throw new NotFound(`No ${purpose} file found for book ${bookId}`)
      }

      // Extract file ID from URL
      const fileId = extractDriveFileId(fileUrl)
      if (!fileId) {
        throw new BadRequest('Invalid file URL in database')
      }

      // Get file metadata from Google Drive
      const driveClient = await this.driveManager.getServiceAccountClient()
      const fileMetadata = await driveClient.getFile(fileId)
      const fileSize = parseInt(fileMetadata.size || '0')

      const config = this.app.get('fileTransfer')
      const chunkSize = config?.chunkSize || 1048576 // 1MB default
      const threshold = config?.chunkedThreshold || 10485760 // 10MB default

      // For small files, use direct download (no chunking needed)
      if (fileSize <= threshold) {
        logger.info('Using direct download for small file', {
          fileSize,
          fileSizeMB: (fileSize / (1024 * 1024)).toFixed(2),
          threshold,
        })
        return {
          totalChunks: 0,
          chunkSize: 0,
          fileName: fileMetadata.name,
          fileSize,
        }
      }

      const totalChunks = Math.ceil(fileSize / chunkSize)

      // Create download session
      const downloadId = `${bookId}-${purpose}-${Date.now()}`
      const downloadSession: DownloadSession = {
        id: downloadId,
        bookId,
        purpose,
        fileId,
        fileName: fileMetadata.name,
        fileSize,
        chunkSize,
        totalChunks,
        lastChunkSent: -1,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        userId: params.user.id,
      }

      this.downloadSessions.set(downloadId, downloadSession)

      logger.info('Chunked download initialized', {
        downloadId,
        bookId,
        purpose,
        fileName: fileMetadata.name,
        fileSize,
        fileSizeMB: (fileSize / (1024 * 1024)).toFixed(2),
        totalChunks,
        chunkSize,
        threshold,
      })

      // Emit initialization event
      if (params.connection) {
        this.app.channel(`user/${params.user.id}`).send({
          type: 'download-initialized',
          downloadId,
          bookId,
          purpose,
          fileName: fileMetadata.name,
          fileSize,
          totalChunks,
          chunkSize,
        })
      }

      return {
        downloadId,
        totalChunks,
        chunkSize,
        fileName: fileMetadata.name,
        fileSize,
      }
    } catch (error) {
      logger.error('Failed to initialize chunked download', error)
      throw error
    }
  }

  /**
   * Download a specific chunk
   */
  async downloadChunk(
    request: ChunkDownloadRequest,
    params: Params,
  ): Promise<ChunkDownloadResult> {
    try {
      const { downloadId, chunkIndex } = request

      logger.info('downloadChunk called', {
        downloadId,
        chunkIndex,
        hasParams: !!params,
        hasUser: !!params?.user,
      })

      // Get download session
      const session = this.downloadSessions.get(downloadId)
      if (!session) {
        throw new NotFound(`Download session not found: ${downloadId}`)
      }

      // Check if download was cancelled
      if (session.cancelled) {
        throw new BadRequest('Download was cancelled')
      }

      // Verify user owns this session
      if (session.userId !== params.user?.id) {
        throw new BadRequest('Unauthorized access to download session')
      }

      // Validate chunk index
      if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
        throw new BadRequest(
          `Invalid chunk index: ${chunkIndex} (total: ${session.totalChunks})`,
        )
      }

      // Calculate byte range for this chunk
      const startByte = chunkIndex * session.chunkSize
      const endByte = Math.min(
        startByte + session.chunkSize - 1,
        session.fileSize - 1,
      )

      logger.debug('Downloading chunk', {
        downloadId,
        chunkIndex,
        startByte,
        endByte,
        fileSize: session.fileSize,
        fileSizeMB: (session.fileSize / (1024 * 1024)).toFixed(2),
      })

      // Download chunk from Google Drive using HTTP range request
      const driveClient = await this.driveManager.getServiceAccountClient()
      const chunkBuffer = await driveClient.downloadFileChunk(
        session.fileId,
        startByte,
        endByte,
      )

      const base64Data = chunkBuffer.toString('base64')

      // Update session
      session.lastChunkSent = chunkIndex
      session.lastActivityAt = new Date()

      const complete = chunkIndex === session.totalChunks - 1

      logger.debug('Chunk downloaded', {
        downloadId,
        chunkIndex,
        chunkSize: chunkBuffer.length,
        complete,
      })

      // Emit progress event
      if (params.connection) {
        const progress = Math.round(
          ((chunkIndex + 1) / session.totalChunks) * 100,
        )
        this.app.channel(`user/${params.user?.id}`).send({
          type: 'download-progress',
          downloadId,
          chunkIndex,
          totalChunks: session.totalChunks,
          progress,
          complete,
        })
      }

      // Clean up session if complete
      if (complete) {
        this.downloadSessions.delete(downloadId)
        logger.info('Download completed', { downloadId })
      }

      return {
        data: base64Data,
        chunkIndex,
        totalChunks: session.totalChunks,
        complete,
      }
    } catch (error) {
      logger.error('Failed to download chunk', error)
      throw error
    }
  }

  /**
   * Cancel a chunked download
   */
  async downloadChunkCancel(downloadId: string, params: Params): Promise<void> {
    try {
      const session = this.downloadSessions.get(downloadId)

      if (!session) {
        // Session already gone, nothing to do
        return
      }

      // Verify user owns this session
      if (session.userId !== params.user?.id) {
        throw new BadRequest('Unauthorized access to download session')
      }

      // Mark as cancelled and remove
      session.cancelled = true
      this.downloadSessions.delete(downloadId)

      logger.info('Chunked download cancelled', {
        downloadId,
        userId: params.user?.id,
        fileName: session.fileName,
      })

      // Emit cancellation event
      if (params.connection) {
        this.app.channel(`user/${params.user?.id}`).send({
          type: 'download-cancelled',
          downloadId,
        })
      }
    } catch (error) {
      logger.error('Failed to cancel chunked download', error)
      throw error
    }
  }

  /**
   * Start cleanup task for expired download sessions
   */
  private startDownloadCleanup(): void {
    // Run cleanup every 5 minutes
    this.downloadCleanupInterval = setInterval(
      () => {
        this.cleanupExpiredDownloads()
      },
      5 * 60 * 1000,
    )

    logger.info('Download session cleanup task started')
  }

  /**
   * Clean up expired download sessions
   */
  private cleanupExpiredDownloads(): void {
    const now = new Date()
    const timeout = 30 * 60 * 1000 // 30 minutes
    let cleanedCount = 0

    for (const [downloadId, session] of this.downloadSessions.entries()) {
      const age = now.getTime() - session.lastActivityAt.getTime()

      if (age > timeout) {
        logger.info('Cleaning up expired download session', {
          downloadId,
          userId: session.userId,
          fileName: session.fileName,
          age: Math.round(age / 1000) + 's',
        })

        this.downloadSessions.delete(downloadId)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      logger.info('Download session cleanup completed', {
        cleaned: cleanedCount,
        remaining: this.downloadSessions.size,
      })
    }
  }
}
