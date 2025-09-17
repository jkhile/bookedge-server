import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  fileDownloadsDataValidator,
  fileDownloadsPatchValidator,
  fileDownloadsQueryValidator,
  fileDownloadsResolver,
  fileDownloadsExternalResolver,
  fileDownloadsDataResolver,
  fileDownloadsPatchResolver,
  fileDownloadsQueryResolver,
} from './file-downloads.schema'

import type { Application } from '../../declarations'
import { FileDownloadsService, getOptions } from './file-downloads.class'
import {
  fileDownloadsPath,
  fileDownloadsMethods,
} from './file-downloads.shared'

export * from './file-downloads.class'
export * from './file-downloads.schema'

// Register service type with TypeScript
declare module '../../declarations' {
  interface ServiceTypes {
    [fileDownloadsPath]: FileDownloadsService
  }
}

// A configure function that registers the service and its hooks via `app.configure`
export const fileDownloads = (app: Application) => {
  // Register our service on the Feathers application
  app.use(fileDownloadsPath, new FileDownloadsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: fileDownloadsMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })

  // Initialize hooks
  app.service(fileDownloadsPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(fileDownloadsExternalResolver),
        schemaHooks.resolveResult(fileDownloadsResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(fileDownloadsQueryValidator),
        schemaHooks.resolveQuery(fileDownloadsQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(fileDownloadsDataValidator),
        schemaHooks.resolveData(fileDownloadsDataResolver),
      ],
      patch: [
        schemaHooks.validateData(fileDownloadsPatchValidator),
        schemaHooks.resolveData(fileDownloadsPatchResolver),
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
