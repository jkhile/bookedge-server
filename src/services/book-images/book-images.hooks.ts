// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { hooks as schemaHooks } from '@feathersjs/schema'
import { authenticate } from '@feathersjs/authentication'

import {
  bookImagesDataValidator,
  bookImagesPatchValidator,
  bookImagesQueryValidator,
  bookImagesResolver,
  bookImagesExternalResolver,
  bookImagesDataResolver,
  bookImagesPatchResolver,
  bookImagesQueryResolver,
} from './book-images.schema'

// Add any additional hooks here
export const bookImagesHooks = {
  around: {
    all: [
      authenticate('jwt'),
      schemaHooks.resolveExternal(bookImagesExternalResolver),
      schemaHooks.resolveResult(bookImagesResolver),
    ],
  },

  before: {
    all: [
      schemaHooks.validateQuery(bookImagesQueryValidator),
      schemaHooks.resolveQuery(bookImagesQueryResolver),
    ],
    find: [],
    get: [],
    create: [
      schemaHooks.validateData(bookImagesDataValidator),
      schemaHooks.resolveData(bookImagesDataResolver),
    ],
    patch: [
      schemaHooks.validateData(bookImagesPatchValidator),
      schemaHooks.resolveData(bookImagesPatchResolver),
    ],
    remove: [],
  },

  after: {
    all: [],
  },

  error: {
    all: [],
  },
}
