// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  pricingDataValidator,
  pricingPatchValidator,
  pricingQueryValidator,
  pricingResolver,
  pricingExternalResolver,
  pricingDataResolver,
  pricingPatchResolver,
  pricingQueryResolver,
} from './pricing.schema'

import type { Application } from '../../declarations'
import { PricingService, getOptions } from './pricing.class'
import { pricingPath, pricingMethods } from './pricing.shared'

export * from './pricing.class'
export * from './pricing.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const pricing = (app: Application) => {
  // Register our service on the Feathers application
  app.use(pricingPath, new PricingService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: pricingMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  // Initialize hooks
  app.service(pricingPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(pricingExternalResolver),
        schemaHooks.resolveResult(pricingResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(pricingQueryValidator),
        schemaHooks.resolveQuery(pricingQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(pricingDataValidator),
        schemaHooks.resolveData(pricingDataResolver),
      ],
      patch: [
        schemaHooks.validateData(pricingPatchValidator),
        schemaHooks.resolveData(pricingPatchResolver),
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
    [pricingPath]: PricingService
  }
}
