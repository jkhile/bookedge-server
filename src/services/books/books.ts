import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import { recordHistoryHook } from '../../hooks/record-history'
import { initializeProjectPriorities } from '../../hooks/initialize-project-priorities'
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
        recordHistoryHook({
          entityType: 'book',
          fields: [
            'title',
            'subtitle',
            'short_description',
            'long_description',
            'keywords',
            'notes',
            'supplementary_notes',
            'marketing_notes',
            'project_priorities',
            'book_cover_text',
            'jacket_front_text',
            'jacket_back_text',
          ],
          defaultValues: {
            title: '',
            subtitle: '',
            short_description: '',
            long_description: '',
            keywords: '',
            notes: '',
            supplementary_notes: '',
            marketing_notes: '',
            project_priorities: '',
            book_cover_text: '',
            jacket_front_text: '',
            jacket_back_text: '',
          },
        }),
      ],
      update: [
        recordHistoryHook({
          entityType: 'book',
          fields: [
            'title',
            'subtitle',
            'short_description',
            'long_description',
            'keywords',
            'notes',
            'supplementary_notes',
            'marketing_notes',
            'project_priorities',
            'book_cover_text',
            'jacket_front_text',
            'jacket_back_text',
          ],
        }),
      ],
      patch: [
        recordHistoryHook({
          entityType: 'book',
          fields: [
            'title',
            'subtitle',
            'short_description',
            'long_description',
            'keywords',
            'notes',
            'supplementary_notes',
            'marketing_notes',
            'project_priorities',
            'book_cover_text',
            'jacket_front_text',
            'jacket_back_text',
            'back_cover_text',
            'jacket_front_text',
            'jacket_back_text',
            'legal_notice',
            'amazon_review_quotes',
            'errata',
            'other_files',
            'interior_advanced_praise',
          ],
        }),
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
        initializeProjectPriorities,
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
