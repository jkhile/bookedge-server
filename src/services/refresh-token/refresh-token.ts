// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  refreshTokenDataValidator,
  refreshTokenPatchValidator,
  refreshTokenQueryValidator,
  refreshTokenResolver,
  refreshTokenExternalResolver,
  refreshTokenDataResolver,
  refreshTokenPatchResolver,
  refreshTokenQueryResolver,
} from './refresh-token.schema'

import type { Application } from '../../declarations'
import { RefreshTokenService, getOptions } from './refresh-token.class'
import { refreshTokenPath, refreshTokenMethods } from './refresh-token.shared'

export * from './refresh-token.class'
export * from './refresh-token.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const refreshToken = (app: Application) => {
  // Register our service on the Feathers application
  app.use(refreshTokenPath, new RefreshTokenService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: refreshTokenMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  // Initialize hooks
  app.service(refreshTokenPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(refreshTokenExternalResolver),
        schemaHooks.resolveResult(refreshTokenResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(refreshTokenQueryValidator),
        schemaHooks.resolveQuery(refreshTokenQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(refreshTokenDataValidator),
        schemaHooks.resolveData(refreshTokenDataResolver),
      ],
      patch: [
        schemaHooks.validateData(refreshTokenPatchValidator),
        schemaHooks.resolveData(refreshTokenPatchResolver),
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
    [refreshTokenPath]: RefreshTokenService
  }
}
