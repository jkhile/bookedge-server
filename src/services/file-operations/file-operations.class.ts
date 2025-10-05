import { BadRequest, GeneralError, NotFound } from '@feathersjs/errors'
import type {
  Id,
  NullableId,
  Params,
  ServiceInterface,
  ServiceMethods,
} from '@feathersjs/feathers'
import { logger } from '../../logger'
import type { Application } from '../../declarations'
import { GoogleDriveManager } from '../../utils/google-drive-manager'
import { toReadableStream } from '../../utils/stream-helpers'
import type {
  FileStorage,
  FileStorageData,
} from '../file-storage/file-storage.schema'
import {
  getUploadSessionManager,
  type ChunkUploadInitData,
} from '../../utils/upload-session-manager'

// Re-export types for shared module
export type { FileStorage } from '../file-storage/file-storage.schema'
export type FileStorageQuery = any
export type FileStoragePatch = Partial<FileStorageData>

// Define the data structures for file operations
export interface FileUploadData {
  book_id: number
  purpose: string
  description?: string
  finalized?: boolean
  metadata?: Record<string, any>
  // File data will be sent as base64 string via SocketIO
  file: {
    name: string
    type: string
    size: number
    data: string // base64 encoded file data
  }
}

export interface FileDownloadQuery {
  format?: 'base64' | 'url' // How to return the file
}

export interface FileDownloadResult {
  id: number
  name: string
  type: string
  size: number
  data?: string // base64 encoded for small files
  url?: string // Download URL for large files
}

export interface FileListQuery {
  book_id?: number
  purpose?: string
  finalized?: boolean
  $limit?: number
  $skip?: number
  $sort?: any
}

export interface FileMoveData {
  fileId: number
  targetBookId?: number
  targetPurpose?: string
}

export interface GalleryQuery {
  book_id: number
}

export interface GalleryItem {
  id: number
  name: string
  thumbnailUrl?: string
  previewUrl?: string
  type: string
  size: number
  uploadedAt: string
}

// Chunked upload/download interfaces
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
  totalChunks: number
  chunkSize: number
  fileInfo: FileStorage
}

export interface ChunkDownloadRequest {
  fileId: number
  chunkIndex: number
}

export interface ChunkDownloadResult {
  data: string
  chunkIndex: number
  totalChunks: number
}

export interface FileOperationsParams extends Params {
  query?: FileListQuery | FileDownloadQuery | GalleryQuery | any
}

// Re-export for shared types
export type { ChunkUploadInitData }

// Custom methods for file operations
export interface FileOperationsServiceMethods {
  // Standard CRUD operations
  find: ServiceMethods<any>['find']
  get: ServiceMethods<any>['get']
  create: ServiceMethods<any>['create']
  update: ServiceMethods<any>['update']
  patch: ServiceMethods<any>['patch']
  remove: ServiceMethods<any>['remove']

  // Custom methods
  upload(data: FileUploadData, params: Params): Promise<FileStorage>
  download(id: Id, params: Params): Promise<FileDownloadResult>
  move(data: FileMoveData, params: Params): Promise<FileStorage>
  gallery(data: GalleryQuery, params: Params): Promise<GalleryItem[]>
  getShareLink(
    id: Id,
    params: Params,
  ): Promise<{ url: string; expiresAt?: Date }>

  // Chunked upload methods
  uploadChunkInit(
    data: ChunkUploadInitData,
    params: Params,
  ): Promise<ChunkUploadInitResult>
  uploadChunk(data: ChunkUploadData, params: Params): Promise<ChunkUploadResult>
  uploadChunkComplete(uploadId: string, params: Params): Promise<FileStorage>
  uploadChunkCancel(uploadId: string, params: Params): Promise<void>

  // Chunked download methods
  downloadChunkInit(
    fileId: number,
    params: Params,
  ): Promise<ChunkDownloadInitResult>
  downloadChunk(
    request: ChunkDownloadRequest,
    params: Params,
  ): Promise<ChunkDownloadResult>
  downloadChunkCancel(fileId: number, params: Params): Promise<void>
}

export class FileOperationsService
  implements
    Partial<ServiceInterface<FileStorage>>,
    FileOperationsServiceMethods
{
  app: Application
  driveManager: GoogleDriveManager

  constructor(app: Application) {
    this.app = app
    this.driveManager = GoogleDriveManager.getInstance(app)
  }

  // Standard find method - list files
  async find(params: FileOperationsParams): Promise<any> {
    const query = params.query || {}

    // Map to file-storage service query
    const fileStorageQuery: any = {}

    if ('book_id' in query) fileStorageQuery.book_id = query.book_id
    if ('purpose' in query) fileStorageQuery.purpose = query.purpose
    if ('finalized' in query && query.finalized !== undefined)
      fileStorageQuery.finalized = query.finalized
    if ('$limit' in query) fileStorageQuery.$limit = query.$limit
    if ('$skip' in query) fileStorageQuery.$skip = query.$skip
    if ('$sort' in query) fileStorageQuery.$sort = query.$sort

    return await this.app.service('file-storage').find({
      ...params,
      query: fileStorageQuery,
      provider: undefined, // Internal call
    })
  }

  // Standard get method - get file metadata
  async get(id: Id, params: Params): Promise<FileStorage> {
    return await this.app.service('file-storage').get(id, {
      ...params,
      provider: undefined,
    })
  }

  // Standard create method - upload file
  async create(data: FileUploadData, params: Params): Promise<FileStorage> {
    return this.upload(data, params)
  }

  // Standard update - not implemented
  async update(): Promise<FileStorage> {
    throw new BadRequest('Update not supported. Use patch instead.')
  }

  // Standard patch - update file metadata
  async patch(
    id: NullableId,
    data: Partial<FileStorageData>,
    params: Params,
  ): Promise<FileStorage> {
    if (!id) throw new BadRequest('File ID is required')

    // Only allow updating certain fields
    const allowedFields = ['description', 'finalized', 'metadata', 'purpose']
    const updateData: any = {}

    for (const field of allowedFields) {
      if (field in data) {
        updateData[field] = (data as any)[field]
      }
    }

    return await this.app.service('file-storage').patch(id, updateData, {
      ...params,
      provider: undefined,
    })
  }

  // Standard remove - delete file
  async remove(id: NullableId, params: Params): Promise<FileStorage> {
    if (!id) throw new BadRequest('File ID is required')

    // Get file metadata
    const fileStorage = await this.app.service('file-storage').get(id, {
      ...params,
      provider: undefined,
    })

    // Delete from Google Drive
    const driveClient = await this.driveManager.getServiceAccountClient()
    await driveClient.deleteFile(fileStorage.drive_id)

    // Delete from database
    const result = await this.app.service('file-storage').remove(id, {
      ...params,
      provider: undefined,
    })

    logger.info(
      `File deleted: ${fileStorage.file_name} (${fileStorage.drive_id})`,
    )

    return result
  }

  /**
   * Custom method: Upload a file to Google Drive
   * File data is sent as base64 encoded string via SocketIO
   */
  async upload(data: FileUploadData, params: Params): Promise<FileStorage> {
    try {
      logger.debug('Upload started', {
        book_id: data.book_id,
        fileName: data.file?.name,
        fileType: data.file?.type,
        fileSize: data.file?.size,
        purpose: data.purpose,
        user: params.user?.email,
      })

      if (!data.file) {
        throw new BadRequest('No file provided')
      }

      const { file, book_id, purpose, description, finalized, metadata } = data

      // Use purpose directly as subfolder name, default to 'other' if not provided
      const targetSubfolder = purpose || 'other'

      // Convert base64 to Buffer
      const fileBuffer = Buffer.from(file.data, 'base64')
      logger.debug('File buffer created', {
        bufferSize: fileBuffer.length,
        originalSize: file.size,
      })

      // Get the book to ensure it exists and get folder ID
      const book = await this.app.service('books').get(book_id)
      logger.debug('Book retrieved', {
        book_id: book.id,
        title: book.title,
        existing_folder_id: book.drive_folder_id,
      })

      // Get or create book folder in Google Drive
      let bookFolderId = book.drive_folder_id
      const driveClient = await this.driveManager.getServiceAccountClient()

      if (!bookFolderId) {
        logger.debug('Creating book folder structure in Google Drive', {
          book_id,
          title: book.title,
        })
        const folderStructure = await driveClient.createBookFolderStructure(
          book_id,
          book.title,
        )
        bookFolderId = folderStructure.folderId
        logger.debug('Book folder created', {
          bookFolderId,
          subfolders: Object.keys(folderStructure.subfolders),
        })

        // Update book with folder ID
        await this.app.service('books').patch(book_id, {
          drive_folder_id: bookFolderId,
        })
        logger.debug('Book updated with folder ID', { book_id, bookFolderId })
      }

      // Get the purpose-specific subfolder
      logger.debug('Looking for purpose subfolder', {
        bookFolderId,
        originalPurpose: purpose,
        targetSubfolder,
      })
      const subfolders = await driveClient.listFiles({
        folderId: bookFolderId,
        query: `mimeType='application/vnd.google-apps.folder' and name='${targetSubfolder}'`,
      })
      logger.debug('Subfolder search results', {
        found: subfolders.files.length,
        folders: subfolders.files.map((f) => ({ id: f.id, name: f.name })),
      })

      let targetFolderId = bookFolderId
      if (subfolders.files.length > 0) {
        targetFolderId = subfolders.files[0].id
        logger.debug('Using existing subfolder', {
          targetFolderId,
          subfolder: targetSubfolder,
        })
      } else {
        // Create subfolder if it doesn't exist
        logger.debug('Creating new subfolder', {
          subfolder: targetSubfolder,
          parentId: bookFolderId,
        })
        const newFolder = await driveClient.createFolder({
          name: targetSubfolder,
          parentId: bookFolderId,
          description: `${targetSubfolder} files for ${book.title}`,
        })
        targetFolderId = newFolder.id
        logger.debug('Subfolder created', {
          targetFolderId,
          subfolder: targetSubfolder,
        })
      }

      // Upload file to Google Drive
      // Convert Buffer to stream for Google Drive API
      const fileStream = toReadableStream(fileBuffer)

      logger.debug('Starting Google Drive upload', {
        fileName: file.name,
        mimeType: file.type,
        targetFolderId,
        bufferSize: fileBuffer.length,
      })

      const uploadResult = await driveClient.uploadFile({
        fileName: file.name,
        mimeType: file.type,
        folderId: targetFolderId,
        fileContent: fileStream,
        description: description,
      })

      logger.debug('Google Drive upload completed', {
        driveFileId: uploadResult.id,
        fileName: uploadResult.name,
        size: uploadResult.size,
        webViewLink: uploadResult.webViewLink,
        parents: uploadResult.parents,
      })

      // Store metadata in database
      const fileStorageData: FileStorageData = {
        book_id,
        drive_id: uploadResult.id,
        drive_folder_id: targetFolderId,
        file_name: uploadResult.name,
        file_path: `/${book.title}/${targetSubfolder}/${uploadResult.name}`,
        original_name: file.name,
        file_size: parseInt(uploadResult.size || file.size.toString()),
        file_type: uploadResult.mimeType,
        file_extension: file.name.split('.').pop() || '',
        purpose: purpose || '',
        description: description || '',
        finalized: finalized || false,
        metadata: {
          ...metadata,
          webViewLink: uploadResult.webViewLink,
          webContentLink: uploadResult.webContentLink,
          thumbnailLink: uploadResult.thumbnailLink,
        } as Record<string, any>,
      }

      logger.debug('Saving file metadata to database', fileStorageData)

      const result = await this.app
        .service('file-storage')
        .create(fileStorageData, {
          ...params,
          provider: undefined, // Internal call
        })

      logger.debug('File metadata saved', {
        fileStorageId: result.id,
        driveId: result.drive_id,
      })

      logger.info(
        `File uploaded successfully: ${file.name} (${uploadResult.id})`,
      )

      // Emit progress event
      if (params.connection) {
        this.app.channel(`user/${params.user?.id}`).send({
          type: 'file-upload-complete',
          data: result,
        })
      }

      return result
    } catch (error) {
      logger.error('File upload failed', error)
      throw error
    }
  }

  /**
   * Custom method: Download a file from Google Drive
   * Returns file as base64 string for small files or a download URL for large files
   */
  async download(id: Id, params: Params): Promise<FileDownloadResult> {
    try {
      // Get file metadata from database
      const fileStorage = await this.app.service('file-storage').get(id, {
        ...params,
        provider: undefined,
      })

      if (!fileStorage) {
        throw new NotFound('File not found')
      }

      // Log the download
      await this.app.service('file-downloads').create(
        {
          file_storage_id: fileStorage.id,
          downloaded_by: params.user?.id || 0,
          completed: true,
        },
        { provider: undefined },
      )

      // For files under 10MB, return base64 data
      // For larger files, return a download URL
      const MAX_DIRECT_SIZE = 10 * 1024 * 1024 // 10MB

      if (fileStorage.file_size <= MAX_DIRECT_SIZE) {
        // Get the file content from Google Drive
        const driveClient = await this.driveManager.getServiceAccountClient()
        const stream = await driveClient.downloadFile(fileStorage.drive_id)

        // Convert stream to base64
        const chunks: Buffer[] = []

        return new Promise((resolve, reject) => {
          stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
          stream.on('error', reject)
          stream.on('end', () => {
            const buffer = Buffer.concat(chunks)
            resolve({
              id: fileStorage.id,
              name: fileStorage.file_name,
              type: fileStorage.file_type,
              size: fileStorage.file_size,
              data: buffer.toString('base64'),
            })
          })
        })
      } else {
        // For large files, return a download URL
        const downloadUrl = (fileStorage.metadata as any)?.webContentLink || ''

        return {
          id: fileStorage.id,
          name: fileStorage.file_name,
          type: fileStorage.file_type,
          size: fileStorage.file_size,
          url: downloadUrl,
        }
      }
    } catch (error) {
      logger.error('File download failed', error)
      throw error
    }
  }

  /**
   * Custom method: Move a file to a different folder or book
   */
  async move(data: FileMoveData, params: Params): Promise<FileStorage> {
    try {
      const { fileId, targetBookId, targetPurpose } = data

      // Get current file metadata
      const fileStorage = await this.app.service('file-storage').get(fileId, {
        ...params,
        provider: undefined,
      })

      const finalBookId = targetBookId || fileStorage.book_id
      const finalPurpose = targetPurpose || fileStorage.purpose

      // Get target book
      const book = await this.app.service('books').get(finalBookId)

      // Ensure book has folder
      let bookFolderId = book.drive_folder_id
      if (!bookFolderId) {
        const driveClient = await this.driveManager.getServiceAccountClient()
        const folderStructure = await driveClient.createBookFolderStructure(
          finalBookId,
          book.title,
        )
        bookFolderId = folderStructure.folderId

        await this.app.service('books').patch(finalBookId, {
          drive_folder_id: bookFolderId,
        })
      }

      // Get or create purpose folder
      const driveClient = await this.driveManager.getServiceAccountClient()
      const subfolders = await driveClient.listFiles({
        folderId: bookFolderId,
        query: `mimeType='application/vnd.google-apps.folder' and name='${finalPurpose}'`,
      })

      let targetFolderId = bookFolderId
      if (subfolders.files.length > 0) {
        targetFolderId = subfolders.files[0].id
      } else if (finalPurpose) {
        const newFolder = await driveClient.createFolder({
          name: finalPurpose,
          parentId: bookFolderId,
          description: `${finalPurpose} files for ${book.title}`,
        })
        targetFolderId = newFolder.id
      }

      // Move file in Google Drive
      await driveClient.moveFile(fileStorage.drive_id, targetFolderId)

      // Update database
      const result = await this.app.service('file-storage').patch(
        fileId,
        {
          purpose: finalPurpose,
        } as any,
        {
          ...params,
          provider: undefined,
        },
      )

      logger.info(
        `File moved: ${fileStorage.file_name} to ${book.title}/${finalPurpose}`,
      )

      return result
    } catch (error) {
      logger.error('File move failed', error)
      throw error
    }
  }

  /**
   * Custom method: Get gallery items (images and PDFs) for a book
   */
  async gallery(data: GalleryQuery, params: Params): Promise<GalleryItem[]> {
    try {
      const { book_id } = data

      // Query for image and PDF files
      const files = await this.app.service('file-storage').find({
        ...params,
        query: {
          book_id,
          file_type: {
            $in: [
              'image/jpeg',
              'image/jpg',
              'image/png',
              'image/gif',
              'image/webp',
              'application/pdf',
            ],
          },
          $sort: { uploaded_at: -1 },
        },
        paginate: false,
        provider: undefined,
      })

      // Transform to gallery items
      const galleryItems: GalleryItem[] = files.map((file: FileStorage) => ({
        id: file.id,
        name: file.file_name,
        thumbnailUrl: (file.metadata as any)?.thumbnailLink,
        previewUrl: (file.metadata as any)?.webViewLink,
        type: file.file_type,
        size: file.file_size,
        uploadedAt: file.uploaded_at,
      }))

      return galleryItems
    } catch (error) {
      logger.error('Gallery retrieval failed', error)
      throw error
    }
  }

  /**
   * Custom method: Get a shareable link for a file
   */
  async getShareLink(
    id: Id,
    params: Params,
  ): Promise<{ url: string; expiresAt?: Date }> {
    try {
      // Get file metadata
      const fileStorage = await this.app.service('file-storage').get(id, {
        ...params,
        provider: undefined,
      })

      // For now, return the webContentLink from metadata
      // In future, we can implement temporary signed URLs
      const url = (fileStorage.metadata as any)?.webContentLink

      if (!url) {
        throw new GeneralError('Share link not available for this file')
      }

      return {
        url,
        // Google Drive links don't expire, but we could implement our own expiry logic
      }
    } catch (error) {
      logger.error('Failed to get share link', error)
      throw error
    }
  }

  /**
   * Chunked Upload: Initialize a chunked upload session
   */
  async uploadChunkInit(
    data: ChunkUploadInitData,
    params: Params,
  ): Promise<ChunkUploadInitResult> {
    try {
      if (!params.user?.id) {
        throw new BadRequest('User authentication required')
      }

      const config = this.app.get('fileTransfer')
      const chunkSize = config?.chunkSize || 1048576 // 1MB default
      const sessionTimeout = config?.sessionTimeout || 3600000 // 1 hour default

      const sessionManager = getUploadSessionManager(sessionTimeout)
      const { uploadId, totalChunks } = sessionManager.createSession(
        params.user.id,
        data,
        chunkSize,
      )

      // Set up Google Drive resumable upload session
      try {
        // Get the book and prepare folder structure
        const { book_id, purpose, description } = data
        const book = await this.app.service('books').get(book_id)
        const targetSubfolder = purpose || 'other'

        // Get or create book folder
        let bookFolderId = book.drive_folder_id
        const driveClient = await this.driveManager.getServiceAccountClient()

        if (!bookFolderId) {
          const folderStructure = await driveClient.createBookFolderStructure(
            book_id,
            book.title,
          )
          bookFolderId = folderStructure.folderId

          await this.app.service('books').patch(book_id, {
            drive_folder_id: bookFolderId,
          })
        }

        // Get or create purpose subfolder
        const subfolders = await driveClient.listFiles({
          folderId: bookFolderId,
          query: `mimeType='application/vnd.google-apps.folder' and name='${targetSubfolder}'`,
        })

        let targetFolderId = bookFolderId
        if (subfolders.files.length > 0) {
          targetFolderId = subfolders.files[0].id
        } else {
          const newFolder = await driveClient.createFolder({
            name: targetSubfolder,
            parentId: bookFolderId,
            description: `${targetSubfolder} files for ${book.title}`,
          })
          targetFolderId = newFolder.id
        }

        // Initiate Google Drive resumable upload session
        const driveSessionUri = await driveClient.initiateResumableUpload({
          fileName: data.file.name,
          mimeType: data.file.type,
          folderId: targetFolderId,
          fileSize: data.file.size,
          description,
        })

        // Store the Drive session URI in the upload session
        sessionManager.setDriveSessionUri(uploadId, driveSessionUri)

        logger.info('Chunked upload initialized with Drive session', {
          uploadId,
          userId: params.user.id,
          fileName: data.file.name,
          fileSize: data.file.size,
          totalChunks,
          driveSessionUri,
        })
      } catch (error) {
        logger.error('Failed to initialize Drive resumable session', error)
        // Clean up the upload session
        sessionManager.removeSession(uploadId)
        throw error
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
   * Chunked Upload: Receive and store a chunk
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

      // Store chunk in memory (fallback)
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
      if ((this.app as any).io) {
        const eventData = {
          type: 'upload-progress',
          uploadId: data.uploadId,
          progress: driveProgress,
          receivedChunks: stats?.receivedChunks || 0,
          totalChunks: stats?.totalChunks || 0,
          receivedBytes: stats?.receivedBytes || 0,
          totalBytes: stats?.totalBytes || 0,
        }

        ;(this.app as any).io.emit('upload-progress', eventData)
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
   * Chunked Upload: Complete the upload and process the file
   */
  async uploadChunkComplete(
    uploadId: string,
    params: Params,
  ): Promise<FileStorage> {
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

      // Get file metadata from session
      const { fileMetadata } = session

      logger.info('Completing chunked upload', {
        uploadId,
        fileName: fileMetadata.file.name,
        totalSize: session.totalBytes,
        receivedBytes: session.receivedBytes,
      })

      // Get book info for metadata
      const { book_id, purpose, description, finalized, metadata } =
        fileMetadata
      const book = await this.app.service('books').get(book_id)
      const targetSubfolder = purpose || 'other'
      const driveClient = await this.driveManager.getServiceAccountClient()

      let uploadResult: {
        id: string
        name: string
        mimeType: string
        size?: string
        parents?: string[]
        webViewLink?: string
        webContentLink?: string
        thumbnailLink?: string
      }

      // Check if file was already uploaded via resumable upload
      if (session.driveFileId) {
        // File already uploaded to Drive - just get the details
        uploadResult = await driveClient.getFile(session.driveFileId)

        logger.info('File uploaded via resumable upload', {
          uploadId,
          driveFileId: session.driveFileId,
          fileName: fileMetadata.file.name,
        })
      } else {
        // Fallback: assemble chunks and upload using traditional method
        logger.info('Using fallback upload method', {
          uploadId,
          fileName: fileMetadata.file.name,
        })

        // Get or create book folder
        let bookFolderId = book.drive_folder_id

        if (!bookFolderId) {
          const folderStructure = await driveClient.createBookFolderStructure(
            book_id,
            book.title,
          )
          bookFolderId = folderStructure.folderId

          await this.app.service('books').patch(book_id, {
            drive_folder_id: bookFolderId,
          })
        }

        // Get or create purpose subfolder
        const subfolders = await driveClient.listFiles({
          folderId: bookFolderId,
          query: `mimeType='application/vnd.google-apps.folder' and name='${targetSubfolder}'`,
        })

        let targetFolderId = bookFolderId
        if (subfolders.files.length > 0) {
          targetFolderId = subfolders.files[0].id
        } else {
          const newFolder = await driveClient.createFolder({
            name: targetSubfolder,
            parentId: bookFolderId,
            description: `${targetSubfolder} files for ${book.title}`,
          })
          targetFolderId = newFolder.id
        }

        // Assemble chunks and upload
        const fileContent = sessionManager.assembleChunks(uploadId)

        uploadResult = await driveClient.uploadFile({
          fileName: fileMetadata.file.name,
          mimeType: fileMetadata.file.type,
          folderId: targetFolderId,
          fileContent,
          description,
        })
      }

      // Store metadata in database
      const targetFolderId = uploadResult.parents?.[0] || ''
      const fileStorageData: FileStorageData = {
        book_id,
        drive_id: uploadResult.id,
        drive_folder_id: targetFolderId,
        file_name: uploadResult.name,
        file_path: `/${book.title}/${targetSubfolder}/${uploadResult.name}`,
        original_name: fileMetadata.file.name,
        file_size: parseInt(
          uploadResult.size || fileMetadata.file.size.toString(),
        ),
        file_type: uploadResult.mimeType,
        file_extension: fileMetadata.file.name.split('.').pop() || '',
        purpose: purpose || '',
        description: description || '',
        finalized: finalized || false,
        metadata: {
          ...metadata,
          webViewLink: uploadResult.webViewLink,
          webContentLink: uploadResult.webContentLink,
          thumbnailLink: uploadResult.thumbnailLink,
        } as Record<string, any>,
      }

      const result = await this.app
        .service('file-storage')
        .create(fileStorageData, {
          ...params,
          provider: undefined,
        })

      // Clean up session
      sessionManager.removeSession(uploadId)

      logger.info('Chunked upload completed', {
        uploadId,
        fileStorageId: result.id,
        fileName: result.file_name,
      })

      // Emit completion event to all connected sockets
      if ((this.app as any).io) {
        ;(this.app as any).io.emit('upload-complete', {
          type: 'upload-complete',
          uploadId,
          fileStorage: result,
        })
      }

      return result
    } catch (error) {
      logger.error('Failed to complete chunked upload', error)
      throw error
    }
  }

  /**
   * Chunked Upload: Cancel an upload session
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

      // Emit cancellation event to all connected sockets
      if ((this.app as any).io) {
        ;(this.app as any).io.emit('upload-cancelled', {
          type: 'upload-cancelled',
          uploadId,
        })
      }
    } catch (error) {
      logger.error('Failed to cancel chunked upload', error)
      throw error
    }
  }

  /**
   * Chunked Download: Initialize a chunked download
   */
  async downloadChunkInit(
    fileId: number,
    params: Params,
  ): Promise<ChunkDownloadInitResult> {
    try {
      // Get file metadata
      const fileStorage = await this.app.service('file-storage').get(fileId, {
        ...params,
        provider: undefined,
      })

      const config = this.app.get('fileTransfer')
      const chunkSize = config?.chunkSize || 1048576 // 1MB default
      const threshold = config?.chunkedThreshold || 10485760 // 10MB default

      // Check if file should use chunked download
      if (fileStorage.file_size <= threshold) {
        // Small file - return 0 chunks to indicate direct download should be used
        return {
          totalChunks: 0,
          chunkSize: 0,
          fileInfo: fileStorage,
        }
      }

      const totalChunks = Math.ceil(fileStorage.file_size / chunkSize)

      logger.info('Chunked download initialized', {
        fileId,
        fileName: fileStorage.file_name,
        fileSize: fileStorage.file_size,
        totalChunks,
      })

      return {
        totalChunks,
        chunkSize,
        fileInfo: fileStorage,
      }
    } catch (error) {
      logger.error('Failed to initialize chunked download', error)
      throw error
    }
  }

  /**
   * Chunked Download: Download a specific chunk
   */
  async downloadChunk(
    request: ChunkDownloadRequest,
    params: Params,
  ): Promise<ChunkDownloadResult> {
    try {
      const { fileId, chunkIndex } = request

      // Get file metadata
      const fileStorage = await this.app.service('file-storage').get(fileId, {
        ...params,
        provider: undefined,
      })

      const config = this.app.get('fileTransfer')
      const chunkSize = config?.chunkSize || 1048576

      const totalChunks = Math.ceil(fileStorage.file_size / chunkSize)

      // Validate chunk index
      if (chunkIndex < 0 || chunkIndex >= totalChunks) {
        throw new BadRequest(
          `Invalid chunk index: ${chunkIndex} (total: ${totalChunks})`,
        )
      }

      // Calculate byte range for this chunk
      const startByte = chunkIndex * chunkSize
      const endByte = Math.min(startByte + chunkSize, fileStorage.file_size)
      const bytesToRead = endByte - startByte

      logger.debug('Downloading chunk', {
        fileId,
        chunkIndex,
        startByte,
        endByte,
        bytesToRead,
      })

      // Download from Google Drive
      const driveClient = await this.driveManager.getServiceAccountClient()
      const stream = await driveClient.downloadFile(fileStorage.drive_id)

      // Read the stream and extract the requested chunk
      const chunks: Buffer[] = []
      let bytesRead = 0

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
          const chunkBuffer = Buffer.from(chunk)
          const currentEnd = bytesRead + chunkBuffer.length

          // Check if this chunk contains data we need
          if (currentEnd > startByte && bytesRead < endByte) {
            // Calculate the slice of this chunk we need
            const sliceStart = Math.max(0, startByte - bytesRead)
            const sliceEnd = Math.min(chunkBuffer.length, endByte - bytesRead)
            const slice = chunkBuffer.slice(sliceStart, sliceEnd)
            chunks.push(slice)
          }

          bytesRead = currentEnd

          // If we've read past our target range, we can stop
          if (bytesRead >= endByte) {
            ;(stream as any).destroy() // Stop reading the stream
          }
        })

        stream.on('error', reject)

        stream.on('end', () => {
          const buffer = Buffer.concat(chunks)
          const base64Data = buffer.toString('base64')

          logger.debug('Chunk downloaded', {
            fileId,
            chunkIndex,
            chunkSize: buffer.length,
          })

          // Emit progress event to all connected sockets
          if ((this.app as any).io) {
            const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100)
            ;(this.app as any).io.emit('download-progress', {
              type: 'download-progress',
              fileId,
              chunkIndex,
              totalChunks,
              progress,
            })
          }

          resolve({
            data: base64Data,
            chunkIndex,
            totalChunks,
          })
        })
      })
    } catch (error) {
      logger.error('Failed to download chunk', error)
      throw error
    }
  }

  /**
   * Chunked Download: Cancel a download (cleanup)
   */
  async downloadChunkCancel(fileId: number, params: Params): Promise<void> {
    // For downloads, there's no persistent state to clean up
    // This is mainly for client-side notification
    logger.info('Chunked download cancelled', {
      fileId,
      userId: params.user?.id,
    })

    if (params.connection && (params.connection as any).emit) {
      ;(params.connection as any).emit('download-cancelled', {
        type: 'download-cancelled',
        fileId,
      })
    }
  }
}
