import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  FileAccessLogs,
  FileAccessLogsData,
  FileAccessLogsQuery,
} from './file-access-logs.schema'

export type { FileAccessLogs, FileAccessLogsData, FileAccessLogsQuery }

export interface FileAccessLogsParams
  extends KnexAdapterParams<FileAccessLogsQuery> {}

// Extend the basic service class
export class FileAccessLogsService extends KnexService<
  FileAccessLogs,
  FileAccessLogsData,
  FileAccessLogsParams
> {
  constructor(options: KnexAdapterOptions) {
    super({
      ...options,
      name: 'file_access_logs',
    })
  }
}

export const getOptions = (app: Application) => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'file_access_logs',
  }
}
