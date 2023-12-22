// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Imprint,
  ImprintData,
  ImprintPatch,
  ImprintQuery,
  ImprintService,
} from './imprints.class'

export type { Imprint, ImprintData, ImprintPatch, ImprintQuery }

export type ImprintClientService = Pick<
  ImprintService<Params<ImprintQuery>>,
  (typeof imprintMethods)[number]
>

export const imprintPath = 'imprints'

export const imprintMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
] as const

export const imprintClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(imprintPath, connection.service(imprintPath), {
    methods: imprintMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [imprintPath]: ImprintClientService
  }
}
