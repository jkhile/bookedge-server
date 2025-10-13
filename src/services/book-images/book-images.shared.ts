// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type {
  BookImages,
  BookImagesData,
  BookImagesPatch,
  BookImagesQuery,
  BookImagesService,
} from './book-images.class'

export type { BookImages, BookImagesData, BookImagesPatch, BookImagesQuery }

export type BookImagesClientService = Pick<
  BookImagesService<Params<BookImagesQuery>>,
  (typeof bookImagesMethods)[number]
>

export const bookImagesPath = 'book-images'

export const bookImagesMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
] as const

export const bookImagesClient = (client: any) => {
  const connection = client.get('connection')

  client.use(bookImagesPath, connection.service(bookImagesPath), {
    methods: bookImagesMethods,
  })
}
