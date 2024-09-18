// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  ReviewQuotes,
  ReviewQuotesData,
  ReviewQuotesPatch,
  ReviewQuotesQuery,
} from './review-quotes.schema'

export type {
  ReviewQuotes,
  ReviewQuotesData,
  ReviewQuotesPatch,
  ReviewQuotesQuery,
}

export interface ReviewQuotesParams
  extends KnexAdapterParams<ReviewQuotesQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class ReviewQuotesService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = ReviewQuotesParams,
> extends KnexService<
  ReviewQuotes,
  ReviewQuotesData,
  ReviewQuotesParams,
  ReviewQuotesPatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'review-quotes',
  }
}
