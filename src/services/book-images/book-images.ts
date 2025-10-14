// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import type { Application, HookContext } from '../../declarations'
import { hooks as schemaHooks } from '@feathersjs/schema'
import { authenticate } from '@feathersjs/authentication'
import { BookImagesService, getOptions } from './book-images.class'
import { bookImagesPath, bookImagesMethods } from './book-images.shared'
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

export * from './book-images.class'
export * from './book-images.schema'

// Set uploaded_by to the current user
const setUploadedBy = async (context: HookContext) => {
  if (context.params.user) {
    context.data.uploaded_by = context.params.user.id
  }
  return context
}

// A configure function that registers the service and its hooks via `app.configure`
export const bookImages = (app: Application) => {
  // Register our service on the Feathers application
  app.use(bookImagesPath, new BookImagesService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: bookImagesMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  // Initialize hooks
  app.service(bookImagesPath).hooks({
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
        setUploadedBy,
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
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [bookImagesPath]: BookImagesService
  }
}
