import authenticationClient from '@feathersjs/authentication-client'
import { bookClient } from './services/books/books.shared'
import { booksHistoryClient } from './services/books-history/books-history.shared'
import { contributorClient } from './services/contributors/contributors.shared'
import { feathers } from '@feathersjs/feathers'
import { imprintClient } from './services/imprints/imprints.shared'
import { logMessageClient } from './services/log-messages/log-messages.shared'
import { pricingClient } from './services/pricing/pricing.shared'
import { releaseClient } from './services/releases/releases.shared'
import { userClient } from './services/users/users.shared'
import { usersImprintsClient } from './services/users-imprints/users-imprints.shared'
// For more information about this file see https://dove.feathersjs.com/guides/cli/client.html
import type { TransportConnection, Application } from '@feathersjs/feathers'
import type { AuthenticationClientOptions } from '@feathersjs/authentication-client'

export type {
  LogMessage,
  LogMessageData,
  LogMessageQuery,
  LogMessagePatch,
} from './services/log-messages/log-messages.shared'

export type {
  Pricing,
  PricingData,
  PricingQuery,
  PricingPatch,
} from './services/pricing/pricing.shared'

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
  UsersImprints,
  UsersImprintsData,
  UsersImprintsQuery,
  UsersImprintsPatch,
} from './services/users-imprints/users-imprints.shared'

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
  client.configure(usersImprintsClient)
  client.configure(bookClient)
  client.configure(booksHistoryClient)
  client.configure(contributorClient)
  client.configure(releaseClient)
  client.configure(pricingClient)
  client.configure(logMessageClient)
  return client
}
