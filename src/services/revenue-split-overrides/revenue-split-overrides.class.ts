// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  RevenueSplitOverride,
  RevenueSplitOverrideData,
  RevenueSplitOverridePatch,
  RevenueSplitOverrideQuery,
} from './revenue-split-overrides.schema'

export type {
  RevenueSplitOverride,
  RevenueSplitOverrideData,
  RevenueSplitOverridePatch,
  RevenueSplitOverrideQuery,
}

export interface RevenueSplitOverrideParams extends KnexAdapterParams<RevenueSplitOverrideQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class RevenueSplitOverrideService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = RevenueSplitOverrideParams,
> extends KnexService<
  RevenueSplitOverride,
  RevenueSplitOverrideData,
  RevenueSplitOverrideParams,
  RevenueSplitOverridePatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'revenue-split-overrides',
  }
}
