// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  FileStorage,
  FileStorageData,
  FileStoragePatch,
  FileStorageQuery,
  FileStorageService,
} from './file-storage.class'

export type { FileStorage, FileStorageData, FileStoragePatch, FileStorageQuery }

export type FileStorageClientService = Pick<
  FileStorageService<Params<FileStorageQuery>>,
  (typeof fileStorageMethods)[number]
>

export const fileStoragePath = 'file-storage'

export const fileStorageMethods: Array<keyof FileStorageService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
]

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
