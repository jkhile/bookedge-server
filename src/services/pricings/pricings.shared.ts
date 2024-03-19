// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Pricing,
  PricingData,
  PricingPatch,
  PricingQuery,
  PricingService,
} from './pricings.class'

export type { Pricing, PricingData, PricingPatch, PricingQuery }

export type PricingClientService = Pick<
  PricingService<Params<PricingQuery>>,
  (typeof pricingMethods)[number]
>

export const pricingPath = 'pricings'

export const pricingMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
] as const

export const pricingClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(pricingPath, connection.service(pricingPath), {
    methods: pricingMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [pricingPath]: PricingClientService
  }
}
