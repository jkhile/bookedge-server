import { KnexService } from '@feathersjs/knex'
import type { Params } from '@feathersjs/feathers'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  MarketingChecklist,
  MarketingChecklistData,
  MarketingChecklistPatch,
  MarketingChecklistQuery,
} from './marketing-checklists.schema'

export type {
  MarketingChecklist,
  MarketingChecklistData,
  MarketingChecklistPatch,
  MarketingChecklistQuery,
}

export interface MarketingChecklistParams extends KnexAdapterParams<MarketingChecklistQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class MarketingChecklistService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = MarketingChecklistParams,
> extends KnexService<
  MarketingChecklist,
  MarketingChecklistData,
  MarketingChecklistParams,
  MarketingChecklistPatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'marketing_checklists',
  }
}
