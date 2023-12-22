import { KnexService } from '@feathersjs/knex'
// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  Pricing,
  PricingData,
  PricingPatch,
  PricingQuery,
} from './pricing.schema'

export type { Pricing, PricingData, PricingPatch, PricingQuery }

export interface PricingParams extends KnexAdapterParams<PricingQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class PricingService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = PricingParams,
> extends KnexService<Pricing, PricingData, PricingParams, PricingPatch> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'pricing',
  }
}
