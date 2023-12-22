// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  BooksHistory,
  BooksHistoryData,
  BooksHistoryPatch,
  BooksHistoryQuery,
  BooksHistoryService,
} from './books-history.class'

export type {
  BooksHistory,
  BooksHistoryData,
  BooksHistoryPatch,
  BooksHistoryQuery,
}

export type BooksHistoryClientService = Pick<
  BooksHistoryService<Params<BooksHistoryQuery>>,
  (typeof booksHistoryMethods)[number]
>

export const booksHistoryPath = 'books-history'

export const booksHistoryMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
] as const

export const booksHistoryClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(booksHistoryPath, connection.service(booksHistoryPath), {
    methods: booksHistoryMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [booksHistoryPath]: BooksHistoryClientService
  }
}
