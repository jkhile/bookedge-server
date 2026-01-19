// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  RevenueSplitOverride,
  RevenueSplitOverrideData,
  RevenueSplitOverridePatch,
  RevenueSplitOverrideQuery,
  RevenueSplitOverrideService,
} from './revenue-split-overrides.class'

export type {
  RevenueSplitOverride,
  RevenueSplitOverrideData,
  RevenueSplitOverridePatch,
  RevenueSplitOverrideQuery,
}

export type RevenueSplitOverrideClientService = Pick<
  RevenueSplitOverrideService<Params<RevenueSplitOverrideQuery>>,
  (typeof revenueSplitOverrideMethods)[number]
>

export const revenueSplitOverridePath = 'revenue-split-overrides'

export const revenueSplitOverrideMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
] as const

export const revenueSplitOverrideClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(
    revenueSplitOverridePath,
    connection.service(revenueSplitOverridePath),
    {
      methods: revenueSplitOverrideMethods,
    },
  )
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [revenueSplitOverridePath]: RevenueSplitOverrideClientService
  }
}
