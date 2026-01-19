// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  ContributorPhotos,
  ContributorPhotosData,
  ContributorPhotosPatch,
  ContributorPhotosQuery,
} from './contributor-photos.schema'

export type {
  ContributorPhotos,
  ContributorPhotosData,
  ContributorPhotosPatch,
  ContributorPhotosQuery,
}

export interface ContributorPhotosParams extends KnexAdapterParams<ContributorPhotosQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class ContributorPhotosService<
  _ServiceParams extends Params = ContributorPhotosParams,
> extends KnexService<
  ContributorPhotos,
  ContributorPhotosData,
  ContributorPhotosParams,
  ContributorPhotosPatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'contributor_photos',
  }
}
