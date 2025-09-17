import type {
  FileDownloads,
  FileDownloadsData,
  FileDownloadsQuery,
  FileDownloadsPatch,
} from './file-downloads.schema'

export type {
  FileDownloads,
  FileDownloadsData,
  FileDownloadsQuery,
  FileDownloadsPatch,
}

export const fileDownloadsPath = 'file-downloads'
export const fileDownloadsMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
] as const
