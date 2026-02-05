// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  marketingChecklistDataValidator,
  marketingChecklistPatchValidator,
  marketingChecklistQueryValidator,
  marketingChecklistResolver,
  marketingChecklistExternalResolver,
  marketingChecklistDataResolver,
  marketingChecklistPatchResolver,
  marketingChecklistQueryResolver,
} from './marketing-checklists.schema'

import type { Application } from '../../declarations'
import {
  MarketingChecklistService,
  getOptions,
} from './marketing-checklists.class'
import {
  marketingChecklistPath,
  marketingChecklistMethods,
} from './marketing-checklists.shared'

export * from './marketing-checklists.class'
export * from './marketing-checklists.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const marketingChecklist = (app: Application) => {
  // Register our service on the Feathers application
  app.use(
    marketingChecklistPath,
    new MarketingChecklistService(getOptions(app)),
    {
      // A list of all methods this service exposes externally
      methods: marketingChecklistMethods,
      // You can add additional custom events to be sent to clients here
      events: [],
    },
  )
  // Initialize hooks
  app.service(marketingChecklistPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(marketingChecklistExternalResolver),
        schemaHooks.resolveResult(marketingChecklistResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(marketingChecklistQueryValidator),
        schemaHooks.resolveQuery(marketingChecklistQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(marketingChecklistDataValidator),
        schemaHooks.resolveData(marketingChecklistDataResolver),
      ],
      patch: [
        schemaHooks.validateData(marketingChecklistPatchValidator),
        schemaHooks.resolveData(marketingChecklistPatchResolver),
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
    [marketingChecklistPath]: MarketingChecklistService
  }
}
