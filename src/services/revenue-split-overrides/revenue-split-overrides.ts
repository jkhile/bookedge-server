// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  revenueSplitOverrideDataValidator,
  revenueSplitOverridePatchValidator,
  revenueSplitOverrideQueryValidator,
  revenueSplitOverrideResolver,
  revenueSplitOverrideExternalResolver,
  revenueSplitOverrideDataResolver,
  revenueSplitOverridePatchResolver,
  revenueSplitOverrideQueryResolver,
} from './revenue-split-overrides.schema'

import type { Application } from '../../declarations'
import {
  RevenueSplitOverrideService,
  getOptions,
} from './revenue-split-overrides.class'
import {
  revenueSplitOverridePath,
  revenueSplitOverrideMethods,
} from './revenue-split-overrides.shared'

export * from './revenue-split-overrides.class'
export * from './revenue-split-overrides.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const revenueSplitOverride = (app: Application) => {
  // Register our service on the Feathers application
  app.use(
    revenueSplitOverridePath,
    new RevenueSplitOverrideService(getOptions(app)),
    {
      // A list of all methods this service exposes externally
      methods: revenueSplitOverrideMethods,
      // You can add additional custom events to be sent to clients here
      events: [],
    },
  )
  // Initialize hooks
  app.service(revenueSplitOverridePath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(revenueSplitOverrideExternalResolver),
        schemaHooks.resolveResult(revenueSplitOverrideResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(revenueSplitOverrideQueryValidator),
        schemaHooks.resolveQuery(revenueSplitOverrideQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(revenueSplitOverrideDataValidator),
        schemaHooks.resolveData(revenueSplitOverrideDataResolver),
      ],
      patch: [
        schemaHooks.validateData(revenueSplitOverridePatchValidator),
        schemaHooks.resolveData(revenueSplitOverridePatchResolver),
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
    [revenueSplitOverridePath]: RevenueSplitOverrideService
  }
}
