// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  reviewQuotesDataValidator,
  reviewQuotesPatchValidator,
  reviewQuotesQueryValidator,
  reviewQuotesResolver,
  reviewQuotesExternalResolver,
  reviewQuotesDataResolver,
  reviewQuotesPatchResolver,
  reviewQuotesQueryResolver,
} from './review-quotes.schema'

import type { Application } from '../../declarations'
import { ReviewQuotesService, getOptions } from './review-quotes.class'
import { reviewQuotesPath, reviewQuotesMethods } from './review-quotes.shared'

export * from './review-quotes.class'
export * from './review-quotes.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const reviewQuotes = (app: Application) => {
  // Register our service on the Feathers application
  app.use(reviewQuotesPath, new ReviewQuotesService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: reviewQuotesMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  // Initialize hooks
  app.service(reviewQuotesPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(reviewQuotesExternalResolver),
        schemaHooks.resolveResult(reviewQuotesResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(reviewQuotesQueryValidator),
        schemaHooks.resolveQuery(reviewQuotesQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(reviewQuotesDataValidator),
        schemaHooks.resolveData(reviewQuotesDataResolver),
      ],
      patch: [
        schemaHooks.validateData(reviewQuotesPatchValidator),
        schemaHooks.resolveData(reviewQuotesPatchResolver),
      ],
      remove: [],
    },
    after: {
      all: [],
    },
    error: {
      all: [],
    },
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [reviewQuotesPath]: ReviewQuotesService
  }
}
