// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  BookContributorRoles,
  BookContributorRolesData,
  BookContributorRolesPatch,
  BookContributorRolesQuery,
  BookContributorRolesService,
} from './book-contributor-roles.class'

export type {
  BookContributorRoles,
  BookContributorRolesData,
  BookContributorRolesPatch,
  BookContributorRolesQuery,
}

export type BookContributorRolesClientService = Pick<
  BookContributorRolesService<Params<BookContributorRolesQuery>>,
  (typeof bookContributorRolesMethods)[number]
>

export const bookContributorRolesPath = 'book-contributor-roles'

export const bookContributorRolesMethods: Array<
  keyof BookContributorRolesService
> = ['find', 'get', 'create', 'patch', 'remove']

export const bookContributorRolesClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(
    bookContributorRolesPath,
    connection.service(bookContributorRolesPath),
    {
      methods: bookContributorRolesMethods,
    },
  )
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [bookContributorRolesPath]: BookContributorRolesClientService
  }
}
