// For more information about this file see https://dove.feathersjs.com/guides/cli/typescript.html
import {
  HookContext as FeathersHookContext,
  NextFunction,
} from '@feathersjs/feathers'
import { Application as FeathersApplication } from '@feathersjs/koa'
import { ApplicationConfiguration } from './configuration'

import { User } from './services/users/users'
import { GoogleDriveService } from './utils/google-drive-service'

export type { NextFunction }

// The types for app.get(name) and app.set(name)

export interface Configuration extends ApplicationConfiguration {
  driveService?: GoogleDriveService
}

// A mapping of service names to types. Will be extended in service files.

export interface ServiceTypes {}

// The application instance type that will be used everywhere else
export type Application = FeathersApplication<ServiceTypes, Configuration>

// The context for hook functions - can be typed with a service class
export type HookContext<S = any> = FeathersHookContext<Application, S>

// Add the user as an optional property to all params
declare module '@feathersjs/feathers' {
  interface Params {
    user?: User
  }
}

// Add the metadata-search service path to the list of service paths
export interface ServiceTypesMap {
  users: 'users'
  contributors: 'contributors'
  releases: 'releases'
  issues: 'issues'
  books: 'books'
  'books-history': 'books-history'
  imprints: 'imprints'
  'log-messages': 'log-messages'
  'signin-history': 'signin-history'
  mentions: 'mentions'
  pricings: 'pricings'
  endorsements: 'endorsements'
  'metadata-search': 'metadata-search'
}
