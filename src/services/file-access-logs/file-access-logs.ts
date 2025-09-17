import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  fileAccessLogsDataValidator,
  fileAccessLogsQueryValidator,
  fileAccessLogsResolver,
  fileAccessLogsExternalResolver,
  fileAccessLogsDataResolver,
  fileAccessLogsQueryResolver,
} from './file-access-logs.schema'

import type { Application } from '../../declarations'
import { FileAccessLogsService, getOptions } from './file-access-logs.class'
import {
  fileAccessLogsPath,
  fileAccessLogsMethods,
} from './file-access-logs.shared'

export * from './file-access-logs.class'
export * from './file-access-logs.schema'

// Register service type with TypeScript
declare module '../../declarations' {
  interface ServiceTypes {
    [fileAccessLogsPath]: FileAccessLogsService
  }
}

// A configure function that registers the service and its hooks via `app.configure`
export const fileAccessLogs = (app: Application) => {
  // Register our service on the Feathers application
  app.use(fileAccessLogsPath, new FileAccessLogsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: fileAccessLogsMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })

  // Initialize hooks
  app.service(fileAccessLogsPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(fileAccessLogsExternalResolver),
        schemaHooks.resolveResult(fileAccessLogsResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(fileAccessLogsQueryValidator),
        schemaHooks.resolveQuery(fileAccessLogsQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(fileAccessLogsDataValidator),
        schemaHooks.resolveData(fileAccessLogsDataResolver),
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
