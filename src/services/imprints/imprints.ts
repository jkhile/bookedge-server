// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  imprintDataValidator,
  imprintPatchValidator,
  imprintQueryValidator,
  imprintResolver,
  imprintExternalResolver,
  imprintDataResolver,
  imprintPatchResolver,
  imprintQueryResolver,
} from './imprints.schema'

import type { Application } from '../../declarations'
import { ImprintService, getOptions } from './imprints.class'
import { imprintPath, imprintMethods } from './imprints.shared'

export * from './imprints.class'
export * from './imprints.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const imprint = (app: Application) => {
  // Register our service on the Feathers application
  app.use(imprintPath, new ImprintService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: imprintMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  // Initialize hooks
  app.service(imprintPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(imprintExternalResolver),
        schemaHooks.resolveResult(imprintResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(imprintQueryValidator),
        schemaHooks.resolveQuery(imprintQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(imprintDataValidator),
        schemaHooks.resolveData(imprintDataResolver),
      ],
      patch: [
        schemaHooks.validateData(imprintPatchValidator),
        schemaHooks.resolveData(imprintPatchResolver),
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
    [imprintPath]: ImprintService
  }
}
