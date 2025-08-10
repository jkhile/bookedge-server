// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  bookContributorDataValidator,
  bookContributorPatchValidator,
  bookContributorQueryValidator,
  bookContributorResolver,
  bookContributorExternalResolver,
  bookContributorDataResolver,
  bookContributorPatchResolver,
  bookContributorQueryResolver,
} from './book-contributors.schema'

import type { Application } from '../../declarations'
import { BookContributorService, getOptions } from './book-contributors.class'
import {
  bookContributorPath,
  bookContributorMethods,
} from './book-contributors.shared'

export * from './book-contributors.class'
export * from './book-contributors.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const bookContributor = (app: Application) => {
  console.log(`Registering book-contributors service at path: ${bookContributorPath}`)
  // Register our service on the Feathers application
  app.use(bookContributorPath, new BookContributorService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: bookContributorMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  console.log(`book-contributors service registered successfully`)
  // Initialize hooks
  app.service(bookContributorPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(bookContributorExternalResolver),
        schemaHooks.resolveResult(bookContributorResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(bookContributorQueryValidator),
        schemaHooks.resolveQuery(bookContributorQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(bookContributorDataValidator),
        schemaHooks.resolveData(bookContributorDataResolver),
      ],
      patch: [
        schemaHooks.validateData(bookContributorPatchValidator),
        schemaHooks.resolveData(bookContributorPatchResolver),
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
    [bookContributorPath]: BookContributorService
  }
}
