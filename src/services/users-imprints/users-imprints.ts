// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  usersImprintsDataValidator,
  usersImprintsPatchValidator,
  usersImprintsQueryValidator,
  usersImprintsResolver,
  usersImprintsExternalResolver,
  usersImprintsDataResolver,
  usersImprintsPatchResolver,
  usersImprintsQueryResolver,
} from './users-imprints.schema'

import type { Application } from '../../declarations'
import { UsersImprintsService, getOptions } from './users-imprints.class'
import {
  usersImprintsPath,
  usersImprintsMethods,
} from './users-imprints.shared'

export * from './users-imprints.class'
export * from './users-imprints.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const usersImprints = (app: Application) => {
  // Register our service on the Feathers application
  app.use(usersImprintsPath, new UsersImprintsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: usersImprintsMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  // Initialize hooks
  app.service(usersImprintsPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(usersImprintsExternalResolver),
        schemaHooks.resolveResult(usersImprintsResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(usersImprintsQueryValidator),
        schemaHooks.resolveQuery(usersImprintsQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(usersImprintsDataValidator),
        schemaHooks.resolveData(usersImprintsDataResolver),
      ],
      patch: [
        schemaHooks.validateData(usersImprintsPatchValidator),
        schemaHooks.resolveData(usersImprintsPatchResolver),
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
    [usersImprintsPath]: UsersImprintsService
  }
}
