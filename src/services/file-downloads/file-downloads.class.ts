import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  FileDownloads,
  FileDownloadsData,
  FileDownloadsPatch,
  FileDownloadsQuery,
} from './file-downloads.schema'

export type {
  FileDownloads,
  FileDownloadsData,
  FileDownloadsPatch,
  FileDownloadsQuery,
}

export interface FileDownloadsParams
  extends KnexAdapterParams<FileDownloadsQuery> {}

// Extend the basic service class for our custom logic
export class FileDownloadsService extends KnexService<
  FileDownloads,
  FileDownloadsData,
  FileDownloadsParams,
  FileDownloadsPatch
> {
  constructor(options: KnexAdapterOptions) {
    super({
      ...options,
      name: 'file_downloads',
    })
  }

  // Override the find method to include file and user information
  async find(params?: FileDownloadsParams): Promise<any> {
    const query = this.createQuery(params)

    // Join with file_storage and users tables
    query
      .leftJoin(
        'file_storage',
        'file_downloads.file_storage_id',
        'file_storage.id',
      )
      .leftJoin('users', 'file_downloads.downloaded_by', 'users.id')
      .select(
        'file_downloads.*',
        'file_storage.file_name',
        'users.name as downloaded_by_name',
        'users.email as downloaded_by_email',
      )

    // Apply ordering - most recent downloads first by default
    if (!params?.query?.$sort) {
      query.orderBy('file_downloads.downloaded_at', 'desc')
    }

    const result = await query

    if (params?.paginate) {
      const countQuery = this.createQuery(params)
      countQuery.clearSelect().clearOrder().count('* as total')
      const [{ total }] = await countQuery

      return {
        total,
        limit: params.paginate.max || 10,
        skip: params.query?.$skip || 0,
        data: result,
      }
    }

    return result
  }

  // Override get method to include file and user information
  async get(
    id: string | number,
    params?: FileDownloadsParams,
  ): Promise<FileDownloads> {
    const query = this.createQuery(params)

    query
      .where('file_downloads.id', id)
      .leftJoin(
        'file_storage',
        'file_downloads.file_storage_id',
        'file_storage.id',
      )
      .leftJoin('users', 'file_downloads.downloaded_by', 'users.id')
      .select(
        'file_downloads.*',
        'file_storage.file_name',
        'users.name as downloaded_by_name',
        'users.email as downloaded_by_email',
      )
      .first()

    const result = await query

    if (!result) {
      throw new Error(`No record found for id ${id}`)
    }

    return result
  }
}

export const getOptions = (app: Application) => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'file_downloads',
  }
}
