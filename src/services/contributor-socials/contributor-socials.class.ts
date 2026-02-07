// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  ContributorSocials,
  ContributorSocialsData,
  ContributorSocialsPatch,
  ContributorSocialsQuery,
} from './contributor-socials.schema'

export type {
  ContributorSocials,
  ContributorSocialsData,
  ContributorSocialsPatch,
  ContributorSocialsQuery,
}

export interface ContributorSocialsParams extends KnexAdapterParams<ContributorSocialsQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class ContributorSocialsService<
  _ServiceParams extends Params = ContributorSocialsParams,
> extends KnexService<
  ContributorSocials,
  ContributorSocialsData,
  ContributorSocialsParams,
  ContributorSocialsPatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'contributor_socials',
  }
}
