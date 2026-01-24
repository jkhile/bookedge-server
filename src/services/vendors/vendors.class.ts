import { KnexService } from '@feathersjs/knex'
import type { Params } from '@feathersjs/feathers'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  Vendor,
  VendorData,
  VendorPatch,
  VendorQuery,
} from './vendors.schema'

export type { Vendor, VendorData, VendorPatch, VendorQuery }

export interface VendorParams extends KnexAdapterParams<VendorQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class VendorService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = VendorParams,
> extends KnexService<Vendor, VendorData, VendorParams, VendorPatch> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'vendors',
  }
}
