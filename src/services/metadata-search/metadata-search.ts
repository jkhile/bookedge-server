// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  metadataSearchQueryValidator,
  metadataSearchQueryResolver,
  metadataSearchResolver,
  // metadataSearchValidator is not used but is exported for potential future use
} from './metadata-search.schema'

import type { Application } from '../../declarations'
import { MetadataSearchService } from './metadata-search.class'
// getOptions is not used in this service since we don't need database adapter options
import {
  metadataSearchPath,
  metadataSearchMethods,
} from './metadata-search.shared'

export * from './metadata-search.class'
export * from './metadata-search.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const metadataSearch = (app: Application) => {
  // Register our service on the Feathers application
  app.use(metadataSearchPath as any, new MetadataSearchService(app), {
    // A list of all methods this service exposes externally
    methods: metadataSearchMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })

  // Initialize hooks
  app.service(metadataSearchPath as any).hooks({
    around: {
      all: [
        authenticate('jwt'), // Ensure JWT authentication for all operations
        schemaHooks.resolveQuery(metadataSearchQueryResolver),
        schemaHooks.resolveData(metadataSearchResolver),
      ],
    },
    before: {
      all: [schemaHooks.validateQuery(metadataSearchQueryValidator)],
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
