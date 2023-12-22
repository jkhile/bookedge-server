// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  booksHistoryDataValidator,
  booksHistoryPatchValidator,
  booksHistoryQueryValidator,
  booksHistoryResolver,
  booksHistoryExternalResolver,
  booksHistoryDataResolver,
  booksHistoryPatchResolver,
  booksHistoryQueryResolver,
} from './books-history.schema'

import type { Application } from '../../declarations'
import { BooksHistoryService, getOptions } from './books-history.class'
import { booksHistoryPath, booksHistoryMethods } from './books-history.shared'

export * from './books-history.class'
export * from './books-history.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const booksHistory = (app: Application) => {
  // Register our service on the Feathers application
  app.use(booksHistoryPath, new BooksHistoryService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: booksHistoryMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  // Initialize hooks
  app.service(booksHistoryPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(booksHistoryExternalResolver),
        schemaHooks.resolveResult(booksHistoryResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(booksHistoryQueryValidator),
        schemaHooks.resolveQuery(booksHistoryQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(booksHistoryDataValidator),
        schemaHooks.resolveData(booksHistoryDataResolver),
      ],
      patch: [
        schemaHooks.validateData(booksHistoryPatchValidator),
        schemaHooks.resolveData(booksHistoryPatchResolver),
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
    [booksHistoryPath]: BooksHistoryService
  }
}
