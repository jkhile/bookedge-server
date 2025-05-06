// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  RefreshToken,
  RefreshTokenData,
  RefreshTokenPatch,
  RefreshTokenQuery,
} from './refresh-token.schema'

export type {
  RefreshToken,
  RefreshTokenData,
  RefreshTokenPatch,
  RefreshTokenQuery,
}

export interface RefreshTokenParams
  extends KnexAdapterParams<RefreshTokenQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class RefreshTokenService<
  ServiceParams extends Params = RefreshTokenParams,
> extends KnexService<
  RefreshToken,
  RefreshTokenData,
  RefreshTokenParams,
  RefreshTokenPatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'refresh-token',
  }
}
