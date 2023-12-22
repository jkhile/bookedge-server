import { KnexService } from '@feathersjs/knex'
// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  Imprint,
  ImprintData,
  ImprintPatch,
  ImprintQuery,
} from './imprints.schema'

export type { Imprint, ImprintData, ImprintPatch, ImprintQuery }

export interface ImprintParams extends KnexAdapterParams<ImprintQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class ImprintService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = ImprintParams,
> extends KnexService<Imprint, ImprintData, ImprintParams, ImprintPatch> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'imprints',
  }
}
