// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  ReviewQuotes,
  ReviewQuotesData,
  ReviewQuotesPatch,
  ReviewQuotesQuery,
  ReviewQuotesService,
} from './review-quotes.class'

export type {
  ReviewQuotes,
  ReviewQuotesData,
  ReviewQuotesPatch,
  ReviewQuotesQuery,
}

export type ReviewQuotesClientService = Pick<
  ReviewQuotesService<Params<ReviewQuotesQuery>>,
  (typeof reviewQuotesMethods)[number]
>

export const reviewQuotesPath = 'review-quotes'

export const reviewQuotesMethods: Array<keyof ReviewQuotesService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
]

export const reviewQuotesClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(reviewQuotesPath, connection.service(reviewQuotesPath), {
    methods: reviewQuotesMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [reviewQuotesPath]: ReviewQuotesClientService
  }
}
