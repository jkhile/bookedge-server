// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  Endorsement,
  EndorsementData,
  EndorsementPatch,
  EndorsementQuery,
} from './endorsements.schema'

export type { Endorsement, EndorsementData, EndorsementPatch, EndorsementQuery }

export interface EndorsementParams extends KnexAdapterParams<EndorsementQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class EndorsementService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = EndorsementParams,
> extends KnexService<
  Endorsement,
  EndorsementData,
  EndorsementParams,
  EndorsementPatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'endorsements',
  }
}
