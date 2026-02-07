// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import type { Application } from '../../declarations'
import { hooks as schemaHooks } from '@feathersjs/schema'
import { authenticate } from '@feathersjs/authentication'
import {
  ContributorSocialsService,
  getOptions,
} from './contributor-socials.class'
import {
  contributorSocialsPath,
  contributorSocialsMethods,
} from './contributor-socials.shared'
import {
  contributorSocialsDataValidator,
  contributorSocialsPatchValidator,
  contributorSocialsQueryValidator,
  contributorSocialsResolver,
  contributorSocialsExternalResolver,
  contributorSocialsDataResolver,
  contributorSocialsPatchResolver,
  contributorSocialsQueryResolver,
} from './contributor-socials.schema'

export * from './contributor-socials.class'
export * from './contributor-socials.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const contributorSocials = (app: Application) => {
  // Register our service on the Feathers application
  app.use(
    contributorSocialsPath,
    new ContributorSocialsService(getOptions(app)),
    {
      // A list of all methods this service exposes externally
      methods: contributorSocialsMethods,
      // You can add additional custom events to be sent to clients here
      events: [],
    },
  )
  // Initialize hooks
  app.service(contributorSocialsPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(contributorSocialsExternalResolver),
        schemaHooks.resolveResult(contributorSocialsResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(contributorSocialsQueryValidator),
        schemaHooks.resolveQuery(contributorSocialsQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(contributorSocialsDataValidator),
        schemaHooks.resolveData(contributorSocialsDataResolver),
      ],
      patch: [
        schemaHooks.validateData(contributorSocialsPatchValidator),
        schemaHooks.resolveData(contributorSocialsPatchResolver),
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
    [contributorSocialsPath]: ContributorSocialsService
  }
}
