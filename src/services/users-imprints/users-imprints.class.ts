import { KnexService } from '@feathersjs/knex'
// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  UsersImprints,
  UsersImprintsData,
  UsersImprintsPatch,
  UsersImprintsQuery,
} from './users-imprints.schema'

export type {
  UsersImprints,
  UsersImprintsData,
  UsersImprintsPatch,
  UsersImprintsQuery,
}

export interface UsersImprintsParams
  extends KnexAdapterParams<UsersImprintsQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class UsersImprintsService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = UsersImprintsParams,
> extends KnexService<
  UsersImprints,
  UsersImprintsData,
  UsersImprintsParams,
  UsersImprintsPatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'users-imprints',
  }
}
