// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  endorsementDataValidator,
  endorsementPatchValidator,
  endorsementQueryValidator,
  endorsementResolver,
  endorsementExternalResolver,
  endorsementDataResolver,
  endorsementPatchResolver,
  endorsementQueryResolver,
} from './endorsements.schema'

import type { Application } from '../../declarations'
import { EndorsementService, getOptions } from './endorsements.class'
import { endorsementPath, endorsementMethods } from './endorsements.shared'

export * from './endorsements.class'
export * from './endorsements.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const endorsement = (app: Application) => {
  // Register our service on the Feathers application
  app.use(endorsementPath, new EndorsementService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: endorsementMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  // Initialize hooks
  app.service(endorsementPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(endorsementExternalResolver),
        schemaHooks.resolveResult(endorsementResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(endorsementQueryValidator),
        schemaHooks.resolveQuery(endorsementQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(endorsementDataValidator),
        schemaHooks.resolveData(endorsementDataResolver),
      ],
      patch: [
        schemaHooks.validateData(endorsementPatchValidator),
        schemaHooks.resolveData(endorsementPatchResolver),
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
    [endorsementPath]: EndorsementService
  }
}
