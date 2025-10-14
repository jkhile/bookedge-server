import type { Application, HookContext } from '../../declarations'
import { ImageProxyService } from './image-proxy.class'
import { imageProxyPath, imageProxyMethods } from './image-proxy.shared'
import { authenticate } from '@feathersjs/authentication'

export * from './image-proxy.class'

// Custom hook to set response headers for image data
const setImageHeaders = async (context: HookContext) => {
  if (context.result && context.result.data) {
    // Set the HTTP response headers
    if (context.params.provider && context.params.res) {
      const res = context.params.res
      res.set('Content-Type', context.result.mimeType)
      res.set(
        'Content-Disposition',
        `inline; filename="${context.result.fileName}"`,
      )
      res.set('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
      res.set('Access-Control-Allow-Origin', '*') // Allow CORS

      // Send the buffer directly
      res.send(context.result.data)

      // Mark as handled so Feathers doesn't try to JSON serialize
      context.result = null
    }
  }
  return context
}

// A configure function that registers the service and its hooks via `app.configure`
export const imageProxy = (app: Application) => {
  // Register our service on the Feathers application
  app.use(imageProxyPath, new ImageProxyService(app), {
    // A list of all methods this service exposes externally
    methods: imageProxyMethods,
    events: [],
  })

  // Initialize hooks
  app.service(imageProxyPath).hooks({
    around: {
      all: [authenticate('jwt')],
    },
    before: {
      all: [],
      get: [],
    },
    after: {
      all: [],
      get: [setImageHeaders],
    },
    error: {
      all: [],
    },
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [imageProxyPath]: ImageProxyService
  }
}
