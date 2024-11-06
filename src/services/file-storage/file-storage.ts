// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  fileStorageDataValidator,
  fileStoragePatchValidator,
  fileStorageQueryValidator,
  fileStorageResolver,
  fileStorageExternalResolver,
  fileStorageDataResolver,
  fileStoragePatchResolver,
  fileStorageQueryResolver,
} from './file-storage.schema'

import type { Application } from '../../declarations'
import { FileStorageService, getOptions } from './file-storage.class'
import { fileStoragePath, fileStorageMethods } from './file-storage.shared'

export * from './file-storage.class'
export * from './file-storage.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const fileStorage = (app: Application) => {
  // Register our service on the Feathers application
  app.use(fileStoragePath, new FileStorageService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: fileStorageMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  // Initialize hooks
  app.service(fileStoragePath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(fileStorageExternalResolver),
        schemaHooks.resolveResult(fileStorageResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(fileStorageQueryValidator),
        schemaHooks.resolveQuery(fileStorageQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(fileStorageDataValidator),
        schemaHooks.resolveData(fileStorageDataResolver),
      ],
      patch: [
        schemaHooks.validateData(fileStoragePatchValidator),
        schemaHooks.resolveData(fileStoragePatchResolver),
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
    [fileStoragePath]: FileStorageService
  }
}
