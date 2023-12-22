import { KnexService } from '@feathersjs/knex'
// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  Contributor,
  ContributorData,
  ContributorPatch,
  ContributorQuery,
} from './contributors.schema'

export type { Contributor, ContributorData, ContributorPatch, ContributorQuery }

export interface ContributorParams
  extends KnexAdapterParams<ContributorQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class ContributorService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = ContributorParams,
> extends KnexService<
  Contributor,
  ContributorData,
  ContributorParams,
  ContributorPatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'contributors',
  }
}
