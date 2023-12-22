// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Book,
  BookData,
  BookPatch,
  BookQuery,
  BookService,
} from './books.class'

export type { Book, BookData, BookPatch, BookQuery }

export type BookClientService = Pick<
  BookService<Params<BookQuery>>,
  (typeof bookMethods)[number]
>

export const bookPath = 'books'

export const bookMethods = ['find', 'get', 'create', 'patch', 'remove'] as const

export const bookClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(bookPath, connection.service(bookPath), {
    methods: bookMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [bookPath]: BookClientService
  }
}
