// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import { recordHistoryHook } from '../../hooks/record-history'

import {
  contributorDataValidator,
  contributorPatchValidator,
  contributorQueryValidator,
  contributorResolver,
  contributorExternalResolver,
  contributorDataResolver,
  contributorPatchResolver,
  contributorQueryResolver,
} from './contributors.schema'

import type { Application } from '../../declarations'
import { ContributorService, getOptions } from './contributors.class'
import { contributorPath, contributorMethods } from './contributors.shared'

export * from './contributors.class'
export * from './contributors.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const contributor = (app: Application) => {
  // Register our service on the Feathers application
  app.use(contributorPath, new ContributorService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: contributorMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  // Initialize hooks
  app.service(contributorPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(contributorExternalResolver),
        schemaHooks.resolveResult(contributorResolver),
      ],
      create: [
        recordHistoryHook({
          entityType: 'contributor',
          fields: [
            'biography',
            'short_biography',
            'amazon_biography',
            'one_line_biography',
            'notes',
          ],
          defaultValues: {
            biography: '',
            short_biography: '',
            amazon_biography: '',
            one_line_biography: '',
            notes: '',
          },
        }),
      ],
      update: [
        recordHistoryHook({
          entityType: 'contributor',
          fields: [
            'biography',
            'short_biography',
            'amazon_biography',
            'one_line_biography',
            'notes',
          ],
        }),
      ],
      patch: [
        recordHistoryHook({
          entityType: 'contributor',
          fields: [
            'biography',
            'short_biography',
            'amazon_biography',
            'one_line_biography',
            'notes',
          ],
        }),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(contributorQueryValidator),
        schemaHooks.resolveQuery(contributorQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(contributorDataValidator),
        schemaHooks.resolveData(contributorDataResolver),
      ],
      patch: [
        schemaHooks.validateData(contributorPatchValidator),
        schemaHooks.resolveData(contributorPatchResolver),
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
    [contributorPath]: ContributorService
  }
}
