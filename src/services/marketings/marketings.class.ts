// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  Marketing,
  MarketingData,
  MarketingPatch,
  MarketingQuery,
} from './marketings.schema'

export type { Marketing, MarketingData, MarketingPatch, MarketingQuery }

export interface MarketingParams extends KnexAdapterParams<MarketingQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class MarketingService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = MarketingParams,
> extends KnexService<
  Marketing,
  MarketingData,
  MarketingParams,
  MarketingPatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'marketings',
  }
}
