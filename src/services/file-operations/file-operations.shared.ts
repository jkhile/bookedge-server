// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import type { ClientApplication } from '../../client'
import type {
  FileOperationsService,
  FileUploadData,
  FileOperationResult,
  FileListQuery,
  FileListResult,
  ChunkUploadInitData,
  ChunkUploadData,
  ChunkUploadInitResult,
  ChunkUploadResult,
  ChunkDownloadInitData,
  ChunkDownloadInitResult,
  ChunkDownloadRequest,
  ChunkDownloadResult,
} from './file-operations.class'

export type {
  FileUploadData,
  FileOperationResult,
  FileListQuery,
  FileListResult,
  ChunkUploadInitData,
  ChunkUploadData,
  ChunkUploadInitResult,
  ChunkUploadResult,
  ChunkDownloadInitData,
  ChunkDownloadInitResult,
  ChunkDownloadRequest,
  ChunkDownloadResult,
}

// Re-export for backward compatibility
export type FileStorage = FileOperationResult
export type FileStoragePatch = any
export type FileStorageQuery = FileListQuery
export type FileDownloadResult = FileOperationResult
export type FileMoveData = any
export type GalleryQuery = any
export type GalleryItem = any

// FileStorageData is the input type for create operations
export type FileStorageData = FileUploadData

export type FileOperationsClientService = Pick<
  FileOperationsService,
  (typeof fileOperationsMethods)[number]
>

export const fileOperationsPath = 'file-operations'

export const fileOperationsMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
  'upload',
  'download',
  'move',
  'gallery',
  'getShareLink',
  'uploadChunkInit',
  'uploadChunk',
  'uploadChunkComplete',
  'uploadChunkCancel',
  'downloadChunkInit',
  'downloadChunk',
  'downloadChunkCancel',
] as const

export const fileOperationsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(fileOperationsPath, connection.service(fileOperationsPath), {
    methods: fileOperationsMethods,
  })
}

// Add service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [fileOperationsPath]: FileOperationsClientService
  }
}
