// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  FileAccessLogs,
  FileAccessLogsData,
  FileAccessLogsQuery,
} from './file-access-logs.schema'
import type { FileAccessLogsService } from './file-access-logs.class'

export type { FileAccessLogs, FileAccessLogsData, FileAccessLogsQuery }

// Note: No patch type since this is an audit log (read-only after creation)
export type FileAccessLogsPatch = never

export type FileAccessLogsClientService = Pick<
  FileAccessLogsService,
  (typeof fileAccessLogsMethods)[number]
>

export const fileAccessLogsPath = 'file-access-logs'

export const fileAccessLogsMethods = [
  'find',
  'get',
  'create',
  'remove',
] as const

export const fileAccessLogsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(fileAccessLogsPath, connection.service(fileAccessLogsPath), {
    methods: fileAccessLogsMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [fileAccessLogsPath]: FileAccessLogsClientService
  }
}
