// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import type { Application } from '../../declarations'
import { BookImagesService, getOptions } from './book-images.class'
import { bookImagesPath, bookImagesMethods } from './book-images.shared'
import { bookImagesHooks } from './book-images.hooks'

export * from './book-images.class'
export * from './book-images.schema'

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
  app.service(bookImagesPath).hooks(bookImagesHooks)
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [bookImagesPath]: BookImagesService
  }
}
