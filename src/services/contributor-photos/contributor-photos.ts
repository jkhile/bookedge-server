// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import type { Application, HookContext } from '../../declarations'
import { hooks as schemaHooks } from '@feathersjs/schema'
import { authenticate } from '@feathersjs/authentication'
import {
  ContributorPhotosService,
  getOptions,
} from './contributor-photos.class'
import {
  contributorPhotosPath,
  contributorPhotosMethods,
} from './contributor-photos.shared'
import {
  contributorPhotosDataValidator,
  contributorPhotosPatchValidator,
  contributorPhotosQueryValidator,
  contributorPhotosResolver,
  contributorPhotosExternalResolver,
  contributorPhotosDataResolver,
  contributorPhotosPatchResolver,
  contributorPhotosQueryResolver,
} from './contributor-photos.schema'

export * from './contributor-photos.class'
export * from './contributor-photos.schema'

// Set uploaded_by to the current user
const setUploadedBy = async (context: HookContext) => {
  if (context.params.user) {
    context.data.uploaded_by = context.params.user.id
  }
  return context
}

// A configure function that registers the service and its hooks via `app.configure`
export const contributorPhotos = (app: Application) => {
  // Register our service on the Feathers application
  app.use(
    contributorPhotosPath,
    new ContributorPhotosService(getOptions(app)),
    {
      // A list of all methods this service exposes externally
      methods: contributorPhotosMethods,
      // You can add additional custom events to be sent to clients here
      events: [],
    },
  )
  // Initialize hooks
  app.service(contributorPhotosPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(contributorPhotosExternalResolver),
        schemaHooks.resolveResult(contributorPhotosResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(contributorPhotosQueryValidator),
        schemaHooks.resolveQuery(contributorPhotosQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(contributorPhotosDataValidator),
        schemaHooks.resolveData(contributorPhotosDataResolver),
        setUploadedBy,
      ],
      patch: [
        schemaHooks.validateData(contributorPhotosPatchValidator),
        schemaHooks.resolveData(contributorPhotosPatchResolver),
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
    [contributorPhotosPath]: ContributorPhotosService
  }
}
