// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Release,
  ReleaseData,
  ReleasePatch,
  ReleaseQuery,
  ReleaseService,
} from './releases.class'

export type { Release, ReleaseData, ReleasePatch, ReleaseQuery }

export type ReleaseClientService = Pick<
  ReleaseService<Params<ReleaseQuery>>,
  (typeof releaseMethods)[number]
>

export const releasePath = 'releases'

export const releaseMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
] as const

export const releaseClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(releasePath, connection.service(releasePath), {
    methods: releaseMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [releasePath]: ReleaseClientService
  }
}
