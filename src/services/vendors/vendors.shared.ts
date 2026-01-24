// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Vendor,
  VendorData,
  VendorPatch,
  VendorQuery,
  VendorService,
} from './vendors.class'

export type { Vendor, VendorData, VendorPatch, VendorQuery }

export type VendorClientService = Pick<
  VendorService<Params<VendorQuery>>,
  (typeof vendorMethods)[number]
>

export const vendorPath = 'vendors'

export const vendorMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
] as const

export const vendorClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(vendorPath, connection.service(vendorPath), {
    methods: vendorMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [vendorPath]: VendorClientService
  }
}
