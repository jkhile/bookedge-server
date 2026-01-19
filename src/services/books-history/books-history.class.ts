import { KnexService } from '@feathersjs/knex'
// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  BooksHistory,
  BooksHistoryData,
  BooksHistoryPatch,
  BooksHistoryQuery,
} from './books-history.schema'

export type {
  BooksHistory,
  BooksHistoryData,
  BooksHistoryPatch,
  BooksHistoryQuery,
}

export interface BooksHistoryParams extends KnexAdapterParams<BooksHistoryQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class BooksHistoryService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = BooksHistoryParams,
> extends KnexService<
  BooksHistory,
  BooksHistoryData,
  BooksHistoryParams,
  BooksHistoryPatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'books-history',
  }
}
