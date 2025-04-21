// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
// import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  MetadataSearchService,
  MetadataSearchResult,
  MetadataSearch,
} from './metadata-search.class'

export type { MetadataSearch, MetadataSearchResult }

export type MetadataSearchClientService = Pick<
  MetadataSearchService,
  (typeof metadataSearchMethods)[number]
>

export const metadataSearchPath = 'metadata-search'

export const metadataSearchMethods = ['find'] as const

export const metadataSearchClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(metadataSearchPath, connection.service(metadataSearchPath), {
    methods: metadataSearchMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [metadataSearchPath]: MetadataSearchClientService
  }
}
