// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import type { ClientApplication } from '../../client'
import type {
  FileStorage,
  FileStoragePatch,
  FileStorageQuery,
  FileOperationsService,
  FileUploadData,
  FileDownloadResult,
  FileMoveData,
  GalleryQuery,
  GalleryItem,
  ChunkUploadInitData,
  ChunkUploadData,
  ChunkUploadInitResult,
  ChunkUploadResult,
  ChunkDownloadInitResult,
  ChunkDownloadRequest,
  ChunkDownloadResult,
} from './file-operations.class'

export type {
  FileStorage,
  FileStoragePatch,
  FileStorageQuery,
  FileUploadData,
  FileDownloadResult,
  FileMoveData,
  GalleryQuery,
  GalleryItem,
  ChunkUploadInitData,
  ChunkUploadData,
  ChunkUploadInitResult,
  ChunkUploadResult,
  ChunkDownloadInitResult,
  ChunkDownloadRequest,
  ChunkDownloadResult,
}

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
