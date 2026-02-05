// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  MarketingChecklist,
  MarketingChecklistData,
  MarketingChecklistPatch,
  MarketingChecklistQuery,
  MarketingChecklistService,
} from './marketing-checklists.class'

export type {
  MarketingChecklist,
  MarketingChecklistData,
  MarketingChecklistPatch,
  MarketingChecklistQuery,
}

export type MarketingChecklistClientService = Pick<
  MarketingChecklistService<Params<MarketingChecklistQuery>>,
  (typeof marketingChecklistMethods)[number]
>

export const marketingChecklistPath = 'marketing-checklists'

export const marketingChecklistMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
] as const

export const marketingChecklistClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(
    marketingChecklistPath,
    connection.service(marketingChecklistPath),
    {
      methods: marketingChecklistMethods,
    },
  )
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [marketingChecklistPath]: MarketingChecklistClientService
  }
}
