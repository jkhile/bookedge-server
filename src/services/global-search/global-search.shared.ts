// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { ClientApplication } from '../../client'
import type {
  GlobalSearchService,
  GlobalSearchResult,
  GlobalSearch,
  GlobalSearchBookResult,
  GlobalSearchContributorResult,
  GlobalSearchVendorResult,
} from './global-search.class'

export type {
  GlobalSearch,
  GlobalSearchResult,
  GlobalSearchBookResult,
  GlobalSearchContributorResult,
  GlobalSearchVendorResult,
}

export type GlobalSearchClientService = Pick<
  GlobalSearchService,
  (typeof globalSearchMethods)[number]
>

export const globalSearchPath = 'global-search'

export const globalSearchMethods = ['find'] as const

export const globalSearchClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(globalSearchPath, connection.service(globalSearchPath), {
    methods: globalSearchMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [globalSearchPath]: GlobalSearchClientService
  }
}
