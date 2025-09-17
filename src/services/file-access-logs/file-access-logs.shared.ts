import type {
  FileAccessLogs,
  FileAccessLogsData,
  FileAccessLogsQuery,
} from './file-access-logs.schema'

export type { FileAccessLogs, FileAccessLogsData, FileAccessLogsQuery }

export const fileAccessLogsPath = 'file-access-logs'
export const fileAccessLogsMethods = [
  'find',
  'get',
  'create',
  'remove',
] as const
