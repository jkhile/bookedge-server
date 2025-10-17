import { authenticate } from '@feathersjs/authentication'
import type { Application } from '../../declarations'
import { FileOperationsService } from './file-operations.class'
import {
  validateUploadPermissions,
  auditFileOperation,
} from './file-operations.hooks'
import {
  fileOperationsPath,
  fileOperationsMethods,
} from './file-operations.shared'

export * from './file-operations.class'
export * from './file-operations.shared'

// Register service type with TypeScript
declare module '../../declarations' {
  interface ServiceTypes {
    [fileOperationsPath]: FileOperationsService
  }
}

// A configure function that registers the service and its hooks via `app.configure`
export const fileOperations = (app: Application) => {
  // Register our service on the Feathers application
  app.use(fileOperationsPath, new FileOperationsService(app), {
    // A list of all methods this service exposes externally
    methods: fileOperationsMethods,
    // You can add additional custom events to be sent to clients here
    events: ['file-progress', 'file-upload-complete', 'file-download-complete'],
  })

  // Initialize hooks
  app.service(fileOperationsPath).hooks({
    around: {
      all: [authenticate('jwt')],
    },
    before: {
      all: [],
      find: [],
      get: [],
      create: [validateUploadPermissions, auditFileOperation('upload')],
      update: [],
      patch: [auditFileOperation('update')],
      remove: [auditFileOperation('delete')],
      // Custom methods
      upload: [validateUploadPermissions, auditFileOperation('upload')],
      download: [auditFileOperation('download')],
      move: [auditFileOperation('move')],
      gallery: [],
      getShareLink: [auditFileOperation('share')],
      // Chunked upload methods
      uploadChunkInit: [],
      uploadChunk: [],
      uploadChunkComplete: [],
      uploadChunkCancel: [],
      // Chunked download methods
      downloadChunkInit: [],
      downloadChunk: [],
      downloadChunkCancel: [],
    },
    after: {
      all: [],
      create: [
        // Emit completion event
        async (context) => {
          if (context.params.connection) {
            app.channel(`user/${context.params.user?.id}`).send({
              type: 'file-upload-complete',
              data: context.result,
            })
          }
          return context
        },
      ],
      download: [
        // Emit download complete event
        async (context) => {
          if (context.params.connection) {
            app.channel(`user/${context.params.user?.id}`).send({
              type: 'file-download-complete',
              data: {
                fileId: context.id,
                fileName: context.result.name,
              },
            })
          }
          return context
        },
      ],
    },
    error: {
      all: [
        async (context) => {
          console.error('File operation error:', context.error)
          return context
        },
      ],
    },
  })
}
