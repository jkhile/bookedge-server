import { KnexService } from '@feathersjs/knex'
// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type { Book, BookData, BookPatch, BookQuery } from './books.schema'

export type { Book, BookData, BookPatch, BookQuery }

export interface BookParams extends KnexAdapterParams<BookQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class BookService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = BookParams,
> extends KnexService<Book, BookData, BookParams, BookPatch> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'books',
  }
}
