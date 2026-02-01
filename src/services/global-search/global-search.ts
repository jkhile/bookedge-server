// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  globalSearchQueryValidator,
  globalSearchQueryResolver,
  globalSearchResolver,
} from './global-search.schema'

import type { Application } from '../../declarations'
import { GlobalSearchService } from './global-search.class'
import { globalSearchPath, globalSearchMethods } from './global-search.shared'

export * from './global-search.class'
export * from './global-search.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const globalSearch = (app: Application) => {
  // Register our service on the Feathers application
  app.use(globalSearchPath as any, new GlobalSearchService(app), {
    // A list of all methods this service exposes externally
    methods: globalSearchMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })

  // Initialize hooks
  app.service(globalSearchPath as any).hooks({
    around: {
      all: [
        authenticate('jwt'), // Ensure JWT authentication for all operations
        schemaHooks.resolveQuery(globalSearchQueryResolver),
        schemaHooks.resolveData(globalSearchResolver),
      ],
    },
    before: {
      all: [schemaHooks.validateQuery(globalSearchQueryValidator)],
      find: [],
    },
    after: {
      all: [],
    },
    error: {
      all: [],
    },
  })
}
