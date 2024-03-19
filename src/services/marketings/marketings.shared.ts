// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Marketing,
  MarketingData,
  MarketingPatch,
  MarketingQuery,
  MarketingService,
} from './marketings.class'

export type { Marketing, MarketingData, MarketingPatch, MarketingQuery }

export type MarketingClientService = Pick<
  MarketingService<Params<MarketingQuery>>,
  (typeof marketingMethods)[number]
>

export const marketingPath = 'marketings'

export const marketingMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
] as const

export const marketingClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(marketingPath, connection.service(marketingPath), {
    methods: marketingMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [marketingPath]: MarketingClientService
  }
}
