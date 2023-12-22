// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  UsersImprints,
  UsersImprintsData,
  UsersImprintsPatch,
  UsersImprintsQuery,
  UsersImprintsService,
} from './users-imprints.class'

export type {
  UsersImprints,
  UsersImprintsData,
  UsersImprintsPatch,
  UsersImprintsQuery,
}

export type UsersImprintsClientService = Pick<
  UsersImprintsService<Params<UsersImprintsQuery>>,
  (typeof usersImprintsMethods)[number]
>

export const usersImprintsPath = 'users-imprints'

export const usersImprintsMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
] as const

export const usersImprintsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(usersImprintsPath, connection.service(usersImprintsPath), {
    methods: usersImprintsMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [usersImprintsPath]: UsersImprintsClientService
  }
}
