// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  mentionsDataValidator,
  mentionsPatchValidator,
  mentionsQueryValidator,
  mentionsResolver,
  mentionsExternalResolver,
  mentionsDataResolver,
  mentionsPatchResolver,
  mentionsQueryResolver,
} from './mentions.schema'

import type { Application } from '../../declarations'
import { MentionsService, getOptions } from './mentions.class'
import { mentionsPath, mentionsMethods } from './mentions.shared'

export * from './mentions.class'
export * from './mentions.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const mentions = (app: Application) => {
  // Register our service on the Feathers application
  app.use(mentionsPath, new MentionsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: mentionsMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  // Initialize hooks
  app.service(mentionsPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(mentionsExternalResolver),
        schemaHooks.resolveResult(mentionsResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(mentionsQueryValidator),
        schemaHooks.resolveQuery(mentionsQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(mentionsDataValidator),
        schemaHooks.resolveData(mentionsDataResolver),
      ],
      patch: [
        schemaHooks.validateData(mentionsPatchValidator),
        schemaHooks.resolveData(mentionsPatchResolver),
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
    [mentionsPath]: MentionsService
  }
}
