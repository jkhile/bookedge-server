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
import type {
  FileStorage,
  FileStorageData,
} from '../file-storage/file-storage.schema'

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

export interface FileOperationsParams extends Params {
  query?: FileListQuery | FileDownloadQuery | GalleryQuery | any
}

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
      if (!data.file) {
        throw new BadRequest('No file provided')
      }

      const { file, book_id, purpose, description, finalized, metadata } = data

      // Convert base64 to Buffer
      const fileBuffer = Buffer.from(file.data, 'base64')

      // Get the book to ensure it exists and get folder ID
      const book = await this.app.service('books').get(book_id)

      // Get or create book folder in Google Drive
      let bookFolderId = book.drive_folder_id
      if (!bookFolderId) {
        const driveClient = await this.driveManager.getServiceAccountClient()
        const folderStructure = await driveClient.createBookFolderStructure(
          book_id,
          book.title,
        )
        bookFolderId = folderStructure.folderId

        // Update book with folder ID
        await this.app.service('books').patch(book_id, {
          drive_folder_id: bookFolderId,
        })
      }

      // Get the purpose-specific subfolder
      const driveClient = await this.driveManager.getServiceAccountClient()
      const subfolders = await driveClient.listFiles({
        folderId: bookFolderId,
        query: `mimeType='application/vnd.google-apps.folder' and name='${purpose}'`,
      })

      let targetFolderId = bookFolderId
      if (subfolders.files.length > 0) {
        targetFolderId = subfolders.files[0].id
      } else if (purpose) {
        // Create purpose folder if it doesn't exist
        const newFolder = await driveClient.createFolder({
          name: purpose,
          parentId: bookFolderId,
          description: `${purpose} files for ${book.title}`,
        })
        targetFolderId = newFolder.id
      }

      // Upload file to Google Drive
      const uploadResult = await driveClient.uploadFile({
        fileName: file.name,
        mimeType: file.type,
        folderId: targetFolderId,
        fileContent: fileBuffer,
        description: description,
      })

      // Store metadata in database
      const fileStorageData: FileStorageData = {
        book_id,
        drive_id: uploadResult.id,
        drive_folder_id: targetFolderId,
        file_name: uploadResult.name,
        file_path: `/${book.title}/${purpose || ''}/${uploadResult.name}`,
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

      const result = await this.app
        .service('file-storage')
        .create(fileStorageData, {
          ...params,
          provider: undefined, // Internal call
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
}
