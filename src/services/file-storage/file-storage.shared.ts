import type {
  FileStorage,
  FileStorageData,
  FileStorageQuery,
  FileStoragePatch,
} from './file-storage.schema'

export type { FileStorage, FileStorageData, FileStorageQuery, FileStoragePatch }

export const fileStoragePath = 'file-storage'
export const fileStorageMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
] as const
