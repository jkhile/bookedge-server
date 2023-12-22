// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  releaseDataValidator,
  releasePatchValidator,
  releaseQueryValidator,
  releaseResolver,
  releaseExternalResolver,
  releaseDataResolver,
  releasePatchResolver,
  releaseQueryResolver,
} from './releases.schema'

import type { Application } from '../../declarations'
import { ReleaseService, getOptions } from './releases.class'
import { releasePath, releaseMethods } from './releases.shared'

export * from './releases.class'
export * from './releases.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const release = (app: Application) => {
  // Register our service on the Feathers application
  app.use(releasePath, new ReleaseService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: releaseMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  // Initialize hooks
  app.service(releasePath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(releaseExternalResolver),
        schemaHooks.resolveResult(releaseResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(releaseQueryValidator),
        schemaHooks.resolveQuery(releaseQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(releaseDataValidator),
        schemaHooks.resolveData(releaseDataResolver),
      ],
      patch: [
        schemaHooks.validateData(releasePatchValidator),
        schemaHooks.resolveData(releasePatchResolver),
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
    [releasePath]: ReleaseService
  }
}
