// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  SigninHistory,
  SigninHistoryData,
  SigninHistoryPatch,
  SigninHistoryQuery,
} from './signin-history.schema'

export type {
  SigninHistory,
  SigninHistoryData,
  SigninHistoryPatch,
  SigninHistoryQuery,
}

export interface SigninHistoryParams
  extends KnexAdapterParams<SigninHistoryQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class SigninHistoryService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = SigninHistoryParams,
> extends KnexService<
  SigninHistory,
  SigninHistoryData,
  SigninHistoryParams,
  SigninHistoryPatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'signin-history',
  }
}
