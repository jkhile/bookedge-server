// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  BookContributor,
  BookContributorData,
  BookContributorPatch,
  BookContributorQuery,
  BookContributorService,
} from './book-contributors.class'

export type {
  BookContributor,
  BookContributorData,
  BookContributorPatch,
  BookContributorQuery,
}

export type BookContributorClientService = Pick<
  BookContributorService<Params<BookContributorQuery>>,
  (typeof bookContributorMethods)[number]
>

export const bookContributorPath = 'book-contributors'

export const bookContributorMethods: Array<keyof BookContributorService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
]

export const bookContributorClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(bookContributorPath, connection.service(bookContributorPath), {
    methods: bookContributorMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [bookContributorPath]: BookContributorClientService
  }
}
