// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
// import { authenticate } from '@feathersjs/authentication'
import customAuthenticate from '../../hooks/customAuthenticate'

import { hooks as schemaHooks } from '@feathersjs/schema'
import { restrictUserFields } from '../../hooks/restrict-user-fields'

import {
  userDataValidator,
  userPatchValidator,
  userQueryValidator,
  userResolver,
  userExternalResolver,
  userDataResolver,
  userPatchResolver,
  userQueryResolver,
} from './users.schema'

import type { Application } from '../../declarations'
import { UserService, getOptions } from './users.class'
import { userPath, userMethods } from './users.shared'

export * from './users.class'
export * from './users.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const user = (app: Application) => {
  // Register our service on the Feathers application
  app.use(userPath, new UserService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: userMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  // Initialize hooks
  app.service(userPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(userExternalResolver),
        schemaHooks.resolveResult(userResolver),
      ],
      find: [customAuthenticate('jwt')],
      get: [customAuthenticate('jwt')],
      create: [],
      update: [customAuthenticate('jwt')],
      patch: [customAuthenticate('jwt')],
      remove: [customAuthenticate('jwt')],
    },
    before: {
      all: [
        schemaHooks.validateQuery(userQueryValidator),
        schemaHooks.resolveQuery(userQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(userDataValidator),
        schemaHooks.resolveData(userDataResolver),
      ],
      update: [restrictUserFields],
      patch: [
        restrictUserFields,
        schemaHooks.validateData(userPatchValidator),
        schemaHooks.resolveData(userPatchResolver),
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
    [userPath]: UserService
  }
}
