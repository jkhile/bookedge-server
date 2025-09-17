import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  FileStorage,
  FileStorageData,
  FileStoragePatch,
  FileStorageQuery,
} from './file-storage.schema'

export type { FileStorage, FileStorageData, FileStoragePatch, FileStorageQuery }

export interface FileStorageParams
  extends KnexAdapterParams<FileStorageQuery> {}

// Extend the basic service class for our custom logic
export class FileStorageService extends KnexService<
  FileStorage,
  FileStorageData,
  FileStorageParams,
  FileStoragePatch
> {
  constructor(options: KnexAdapterOptions) {
    super({
      ...options,
      name: 'file_storage',
    })
  }

  // Override the find method to include book and user information
  async find(params?: FileStorageParams): Promise<any> {
    const query = this.createQuery(params)

    // Join with books and users tables to get additional information
    query
      .leftJoin('books', 'file_storage.book_id', 'books.id')
      .leftJoin(
        'users as uploaded_user',
        'file_storage.uploaded_by',
        'uploaded_user.id',
      )
      .leftJoin(
        'users as updated_user',
        'file_storage.updated_by',
        'updated_user.id',
      )
      .select(
        'file_storage.*',
        'books.title as book_title',
        'uploaded_user.name as uploaded_by_name',
        'updated_user.name as updated_by_name',
      )

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

  // Override get method to include book and user information
  async get(
    id: string | number,
    params?: FileStorageParams,
  ): Promise<FileStorage> {
    const query = this.createQuery(params)

    query
      .where('file_storage.id', id)
      .leftJoin('books', 'file_storage.book_id', 'books.id')
      .leftJoin(
        'users as uploaded_user',
        'file_storage.uploaded_by',
        'uploaded_user.id',
      )
      .leftJoin(
        'users as updated_user',
        'file_storage.updated_by',
        'updated_user.id',
      )
      .select(
        'file_storage.*',
        'books.title as book_title',
        'uploaded_user.name as uploaded_by_name',
        'updated_user.name as updated_by_name',
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
    name: 'file_storage',
  }
}
