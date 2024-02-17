// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  marketingDataValidator,
  marketingPatchValidator,
  marketingQueryValidator,
  marketingResolver,
  marketingExternalResolver,
  marketingDataResolver,
  marketingPatchResolver,
  marketingQueryResolver,
} from './marketing.schema'

import type { Application } from '../../declarations'
import { MarketingService, getOptions } from './marketing.class'
import { marketingPath, marketingMethods } from './marketing.shared'

export * from './marketing.class'
export * from './marketing.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const marketing = (app: Application) => {
  // Register our service on the Feathers application
  app.use(marketingPath, new MarketingService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: marketingMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  // Initialize hooks
  app.service(marketingPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(marketingExternalResolver),
        schemaHooks.resolveResult(marketingResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(marketingQueryValidator),
        schemaHooks.resolveQuery(marketingQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(marketingDataValidator),
        schemaHooks.resolveData(marketingDataResolver),
      ],
      patch: [
        schemaHooks.validateData(marketingPatchValidator),
        schemaHooks.resolveData(marketingPatchResolver),
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
    [marketingPath]: MarketingService
  }
}
