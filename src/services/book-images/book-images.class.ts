// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  BookImages,
  BookImagesData,
  BookImagesPatch,
  BookImagesQuery,
} from './book-images.schema'

export type { BookImages, BookImagesData, BookImagesPatch, BookImagesQuery }

export interface BookImagesParams extends KnexAdapterParams<BookImagesQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class BookImagesService<
  _ServiceParams extends Params = BookImagesParams,
> extends KnexService<
  BookImages,
  BookImagesData,
  BookImagesParams,
  BookImagesPatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'book_images',
  }
}
