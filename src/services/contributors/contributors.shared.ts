// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Contributor,
  ContributorData,
  ContributorPatch,
  ContributorQuery,
  ContributorService,
} from './contributors.class'

export type { Contributor, ContributorData, ContributorPatch, ContributorQuery }

export type ContributorClientService = Pick<
  ContributorService<Params<ContributorQuery>>,
  (typeof contributorMethods)[number]
>

export const contributorPath = 'contributors'

export const contributorMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
] as const

export const contributorClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(contributorPath, connection.service(contributorPath), {
    methods: contributorMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [contributorPath]: ContributorClientService
  }
}
