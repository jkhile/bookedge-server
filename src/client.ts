import authenticationClient from '@feathersjs/authentication-client'
import { bookClient } from './services/books/books.shared'
import { booksHistoryClient } from './services/books-history/books-history.shared'
import { contributorClient } from './services/contributors/contributors.shared'
import { feathers } from '@feathersjs/feathers'
import { imprintClient } from './services/imprints/imprints.shared'
import { logMessageClient } from './services/log-messages/log-messages.shared'
import { releaseClient } from './services/releases/releases.shared'
import { userClient } from './services/users/users.shared'
// For more information about this file see https://dove.feathersjs.com/guides/cli/client.html
import type { TransportConnection, Application } from '@feathersjs/feathers'
import type { AuthenticationClientOptions } from '@feathersjs/authentication-client'

import { bookContributorRolesClient } from './services/book-contributor-roles/book-contributor-roles.shared'
export type {
  BookContributorRoles,
  BookContributorRolesData,
  BookContributorRolesQuery,
  BookContributorRolesPatch,
} from './services/book-contributor-roles/book-contributor-roles.shared'

import { refreshTokenClient } from './services/refresh-token/refresh-token.shared'
export type {
  RefreshToken,
  RefreshTokenData,
  RefreshTokenQuery,
  RefreshTokenPatch,
} from './services/refresh-token/refresh-token.shared'

import { signinHistoryClient } from './services/signin-history/signin-history.shared'
export type {
  SigninHistory,
  SigninHistoryData,
  SigninHistoryQuery,
  SigninHistoryPatch,
} from './services/signin-history/signin-history.shared'

import { mentionsClient } from './services/mentions/mentions.shared'
export type {
  Mentions,
  MentionsData,
  MentionsQuery,
  MentionsPatch,
} from './services/mentions/mentions.shared'

import { issueClient } from './services/issues/issues.shared'
export type {
  Issue,
  IssueData,
  IssueQuery,
  IssuePatch,
} from './services/issues/issues.shared'

import { pricingClient } from './services/pricings/pricings.shared'
export type {
  Pricing,
  PricingData,
  PricingQuery,
  PricingPatch,
} from './services/pricings/pricings.shared'

import { endorsementClient } from './services/endorsements/endorsements.shared'
export type {
  Endorsement,
  EndorsementData,
  EndorsementQuery,
  EndorsementPatch,
} from './services/endorsements/endorsements.shared'

export type { LogMessageData } from './services/log-messages/log-messages.shared'

export type {
  Release,
  ReleaseData,
  ReleaseQuery,
  ReleasePatch,
} from './services/releases/releases.shared'

export type {
  Contributor,
  ContributorData,
  ContributorQuery,
  ContributorPatch,
} from './services/contributors/contributors.shared'

export type {
  BooksHistory,
  BooksHistoryData,
  BooksHistoryQuery,
  BooksHistoryPatch,
} from './services/books-history/books-history.shared'

export type {
  Book,
  BookData,
  BookQuery,
  BookPatch,
} from './services/books/books.shared'

export type {
  Imprint,
  ImprintData,
  ImprintQuery,
  ImprintPatch,
} from './services/imprints/imprints.shared'

export type {
  User,
  UserData,
  UserQuery,
  UserPatch,
} from './services/users/users.shared'

export interface Configuration {
  connection: TransportConnection<ServiceTypes>
}

export interface ServiceTypes {}

export type ClientApplication = Application<ServiceTypes, Configuration>

/**
 * Returns a typed client for the bookedge-server app.
 *
 * @param connection The REST or Socket.io Feathers client connection
 * @param authenticationOptions Additional settings for the authentication client
 * @see https://dove.feathersjs.com/api/client.html
 * @returns The Feathers client application
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createClient = <Configuration = any>(
  connection: TransportConnection<ServiceTypes>,
  authenticationOptions: Partial<AuthenticationClientOptions> = {},
) => {
  const client: ClientApplication = feathers()

  client.configure(connection)
  client.configure(authenticationClient(authenticationOptions))
  client.set('connection', connection)

  client.configure(userClient)
  client.configure(imprintClient)
  client.configure(bookClient)
  client.configure(booksHistoryClient)
  client.configure(contributorClient)
  client.configure(releaseClient)
  client.configure(logMessageClient)
  client.configure(endorsementClient)
  client.configure(pricingClient)
  client.configure(issueClient)
  client.configure(mentionsClient)
  client.configure(signinHistoryClient)
  client.configure(refreshTokenClient)
  client.configure(bookContributorRolesClient)
  return client
}
