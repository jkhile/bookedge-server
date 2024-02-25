import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import { recordHistoryHook } from '../../hooks/record-history'
import { BookService, getOptions } from './books.class'
import { bookMethods, bookPath } from './books.shared'
// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import {
  bookDataResolver,
  bookDataValidator,
  bookExternalResolver,
  bookPatchResolver,
  bookPatchValidator,
  bookQueryResolver,
  bookQueryValidator,
  bookResolver,
} from './books.schema'

import type { Application } from '../../declarations'

export * from './books.class'
export * from './books.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const book = (app: Application) => {
  // Register our service on the Feathers application
  app.use(bookPath, new BookService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: bookMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  // Initialize hooks
  app.service(bookPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(bookExternalResolver),
        schemaHooks.resolveResult(bookResolver),
      ],
      create: [
        recordHistoryHook([
          'title',
          'subtitle',
          'short_description',
          'long_description',
          'keywords',
          'notes',
        ]),
      ],
      update: [
        recordHistoryHook([
          'title',
          'subtitle',
          'short_description',
          'long_description',
          'keywords',
          'notes',
        ]),
      ],
      patch: [
        recordHistoryHook([
          'title',
          'subtitle',
          'short_description',
          'long_description',
          'keywords',
          'notes',
        ]),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(bookQueryValidator),
        schemaHooks.resolveQuery(bookQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(bookDataValidator),
        schemaHooks.resolveData(bookDataResolver),
      ],
      patch: [
        schemaHooks.validateData(bookPatchValidator),
        schemaHooks.resolveData(bookPatchResolver),
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
    [bookPath]: BookService
  }
}
