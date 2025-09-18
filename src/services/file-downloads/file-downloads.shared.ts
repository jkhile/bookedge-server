// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  FileDownloads,
  FileDownloadsData,
  FileDownloadsQuery,
  FileDownloadsPatch,
} from './file-downloads.schema'
import type { FileDownloadsService } from './file-downloads.class'

export type {
  FileDownloads,
  FileDownloadsData,
  FileDownloadsQuery,
  FileDownloadsPatch,
}

export type FileDownloadsClientService = Pick<
  FileDownloadsService,
  (typeof fileDownloadsMethods)[number]
>

export const fileDownloadsPath = 'file-downloads'

export const fileDownloadsMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
] as const

export const fileDownloadsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(fileDownloadsPath, connection.service(fileDownloadsPath), {
    methods: fileDownloadsMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [fileDownloadsPath]: FileDownloadsClientService
  }
}
