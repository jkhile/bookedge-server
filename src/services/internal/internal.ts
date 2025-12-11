/**
 * Internal Service Configuration
 *
 * Registers the internal service for service-to-service communication.
 * Uses service authentication instead of JWT user authentication.
 */
import type { Application } from '../../declarations'
import { InternalService } from './internal.class'
import { internalPath, internalMethods } from './internal.shared'
import { serviceAuthenticate } from '../../hooks/serviceAuthenticate'

export * from './internal.class'

// A configure function that registers the service and its hooks via `app.configure`
export const internal = (app: Application) => {
  // Register our service on the Feathers application
  app.use(internalPath, new InternalService(app), {
    // A list of all methods this service exposes externally
    methods: internalMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })

  // Initialize hooks
  app.service(internalPath).hooks({
    around: {
      // Use service authentication instead of user JWT authentication
      all: [serviceAuthenticate()],
    },
    before: {
      all: [],
      find: [],
      get: [],
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
    [internalPath]: InternalService
  }
}
