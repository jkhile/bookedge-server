// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  bookContributorRolesDataValidator,
  bookContributorRolesPatchValidator,
  bookContributorRolesQueryValidator,
  bookContributorRolesResolver,
  bookContributorRolesExternalResolver,
  bookContributorRolesDataResolver,
  bookContributorRolesPatchResolver,
  bookContributorRolesQueryResolver,
} from './book-contributor-roles.schema'

import type { Application } from '../../declarations'
import {
  BookContributorRolesService,
  getOptions,
} from './book-contributor-roles.class'
import {
  bookContributorRolesPath,
  bookContributorRolesMethods,
} from './book-contributor-roles.shared'

export * from './book-contributor-roles.class'
export * from './book-contributor-roles.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const bookContributorRoles = (app: Application) => {
  // Register our service on the Feathers application
  app.use(
    bookContributorRolesPath,
    new BookContributorRolesService(getOptions(app)),
    {
      // A list of all methods this service exposes externally
      methods: bookContributorRolesMethods,
      // You can add additional custom events to be sent to clients here
      events: [],
    },
  )
  // Initialize hooks
  app.service(bookContributorRolesPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(bookContributorRolesExternalResolver),
        schemaHooks.resolveResult(bookContributorRolesResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(bookContributorRolesQueryValidator),
        schemaHooks.resolveQuery(bookContributorRolesQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(bookContributorRolesDataValidator),
        schemaHooks.resolveData(bookContributorRolesDataResolver),
      ],
      patch: [
        schemaHooks.validateData(bookContributorRolesPatchValidator),
        schemaHooks.resolveData(bookContributorRolesPatchResolver),
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
    [bookContributorRolesPath]: BookContributorRolesService
  }
}
