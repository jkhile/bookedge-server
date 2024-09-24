// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  signinHistoryDataValidator,
  signinHistoryPatchValidator,
  signinHistoryQueryValidator,
  signinHistoryResolver,
  signinHistoryExternalResolver,
  signinHistoryDataResolver,
  signinHistoryPatchResolver,
  signinHistoryQueryResolver,
} from './signin-history.schema'

import type { Application } from '../../declarations'
import { SigninHistoryService, getOptions } from './signin-history.class'
import {
  signinHistoryPath,
  signinHistoryMethods,
} from './signin-history.shared'

export * from './signin-history.class'
export * from './signin-history.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const signinHistory = (app: Application) => {
  // Register our service on the Feathers application
  app.use(signinHistoryPath, new SigninHistoryService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: signinHistoryMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  // Initialize hooks
  app.service(signinHistoryPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(signinHistoryExternalResolver),
        schemaHooks.resolveResult(signinHistoryResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(signinHistoryQueryValidator),
        schemaHooks.resolveQuery(signinHistoryQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(signinHistoryDataValidator),
        schemaHooks.resolveData(signinHistoryDataResolver),
      ],
      patch: [
        schemaHooks.validateData(signinHistoryPatchValidator),
        schemaHooks.resolveData(signinHistoryPatchResolver),
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
    [signinHistoryPath]: SigninHistoryService
  }
}
