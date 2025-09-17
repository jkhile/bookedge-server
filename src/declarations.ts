// For more information about this file see https://dove.feathersjs.com/guides/cli/typescript.html
import {
  HookContext as FeathersHookContext,
  NextFunction,
} from '@feathersjs/feathers'
import { Application as FeathersApplication } from '@feathersjs/koa'
import { ApplicationConfiguration } from './configuration'

import { User } from './services/users/users'
import type { GoogleDriveManager } from './utils/google-drive-manager'

export type { NextFunction }

// The types for app.get(name) and app.set(name)

export interface Configuration extends ApplicationConfiguration {
  driveManager?: GoogleDriveManager
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
  'file-storage': 'file-storage'
  'file-downloads': 'file-downloads'
  'file-access-logs': 'file-access-logs'
  'metadata-search': 'metadata-search'
}
