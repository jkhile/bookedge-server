// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  vendorDataValidator,
  vendorPatchValidator,
  vendorQueryValidator,
  vendorResolver,
  vendorExternalResolver,
  vendorDataResolver,
  vendorPatchResolver,
  vendorQueryResolver,
} from './vendors.schema'

import type { Application } from '../../declarations'
import { VendorService, getOptions } from './vendors.class'
import { vendorPath, vendorMethods } from './vendors.shared'

export * from './vendors.class'
export * from './vendors.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const vendor = (app: Application) => {
  // Register our service on the Feathers application
  app.use(vendorPath, new VendorService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: vendorMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  // Initialize hooks
  app.service(vendorPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(vendorExternalResolver),
        schemaHooks.resolveResult(vendorResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(vendorQueryValidator),
        schemaHooks.resolveQuery(vendorQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(vendorDataValidator),
        schemaHooks.resolveData(vendorDataResolver),
      ],
      patch: [
        schemaHooks.validateData(vendorPatchValidator),
        schemaHooks.resolveData(vendorPatchResolver),
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
    [vendorPath]: VendorService
  }
}
