// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  issueDataValidator,
  issuePatchValidator,
  issueQueryValidator,
  issueResolver,
  issueExternalResolver,
  issueDataResolver,
  issuePatchResolver,
  issueQueryResolver,
} from './issues.schema'

import type { Application } from '../../declarations'
import { IssueService, getOptions } from './issues.class'
import { issuePath, issueMethods } from './issues.shared'
import { notifyBookOnIssueResolved } from '../../hooks/notify-book-on-issue-resolved'

export * from './issues.class'
export * from './issues.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const issue = (app: Application) => {
  // Register our service on the Feathers application
  app.use(issuePath, new IssueService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: issueMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  })
  // Initialize hooks
  app.service(issuePath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(issueExternalResolver),
        schemaHooks.resolveResult(issueResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(issueQueryValidator),
        schemaHooks.resolveQuery(issueQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(issueDataValidator),
        schemaHooks.resolveData(issueDataResolver),
      ],
      patch: [
        schemaHooks.validateData(issuePatchValidator),
        schemaHooks.resolveData(issuePatchResolver),
      ],
      remove: [],
    },
    after: {
      all: [],
      patch: [notifyBookOnIssueResolved],
      update: [notifyBookOnIssueResolved],
    },
    error: {
      all: [],
    },
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [issuePath]: IssueService
  }
}
