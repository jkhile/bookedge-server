// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  FileStorage,
  FileStorageData,
  FileStorageQuery,
  FileStoragePatch,
} from './file-storage.schema'
import type { FileStorageService } from './file-storage.class'

export type { FileStorage, FileStorageData, FileStorageQuery, FileStoragePatch }

export type FileStorageClientService = Pick<
  FileStorageService,
  (typeof fileStorageMethods)[number]
>

export const fileStoragePath = 'file-storage'

export const fileStorageMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
] as const

export const fileStorageClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(fileStoragePath, connection.service(fileStoragePath), {
    methods: fileStorageMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [fileStoragePath]: FileStorageClientService
  }
}
