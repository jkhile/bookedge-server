// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Endorsement,
  EndorsementData,
  EndorsementPatch,
  EndorsementQuery,
  EndorsementService,
} from './endorsements.class'

export type { Endorsement, EndorsementData, EndorsementPatch, EndorsementQuery }

export type EndorsementClientService = Pick<
  EndorsementService<Params<EndorsementQuery>>,
  (typeof endorsementMethods)[number]
>

export const endorsementPath = 'endorsements'

export const endorsementMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
] as const

export const endorsementClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(endorsementPath, connection.service(endorsementPath), {
    methods: endorsementMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [endorsementPath]: EndorsementClientService
  }
}
