import { KnexService } from '@feathersjs/knex'
// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  Release,
  ReleaseData,
  ReleasePatch,
  ReleaseQuery,
} from './releases.schema'

export type { Release, ReleaseData, ReleasePatch, ReleaseQuery }

export interface ReleaseParams extends KnexAdapterParams<ReleaseQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class ReleaseService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = ReleaseParams,
> extends KnexService<Release, ReleaseData, ReleaseParams, ReleasePatch> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'releases',
  }
}
