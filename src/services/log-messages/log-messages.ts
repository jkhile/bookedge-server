// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  logMessageDataValidator,
  logMessagePatchValidator,
  logMessageQueryValidator,
  logMessageResolver,
  logMessageExternalResolver,
  logMessageDataResolver,
  logMessagePatchResolver,
  logMessageQueryResolver,
} from './log-messages.schema'

import type { Application } from '../../declarations'
import { LogMessageService, getOptions } from './log-messages.class'
import { logMessagePath, logMessageMethods } from './log-messages.shared'

export * from './log-messages.class'
export * from './log-messages.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const logMessage = (app: Application) => {
  // Register our service on the Feathers application
  app.use(logMessagePath, new LogMessageService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: logMessageMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  // Initialize hooks
  app.service(logMessagePath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(logMessageExternalResolver),
        schemaHooks.resolveResult(logMessageResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(logMessageQueryValidator),
        schemaHooks.resolveQuery(logMessageQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(logMessageDataValidator),
        schemaHooks.resolveData(logMessageDataResolver),
      ],
      patch: [
        schemaHooks.validateData(logMessagePatchValidator),
        schemaHooks.resolveData(logMessagePatchResolver),
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
    [logMessagePath]: LogMessageService
  }
}
