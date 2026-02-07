import authenticationClient from '@feathersjs/authentication-client'
import { bookClient } from './services/books/books.shared'
import { booksHistoryClient } from './services/books-history/books-history.shared'
import { contributorClient } from './services/contributors/contributors.shared'
import { feathers } from '@feathersjs/feathers'
import { vendorClient } from './services/vendors/vendors.shared'
import { logMessageClient } from './services/log-messages/log-messages.shared'
import { releaseClient } from './services/releases/releases.shared'
import { userClient } from './services/users/users.shared'
// For more information about this file see https://dove.feathersjs.com/guides/cli/client.html
import type { TransportConnection, Application } from '@feathersjs/feathers'
import type { AuthenticationClientOptions } from '@feathersjs/authentication-client'

import { bookContributorRolesClient } from './services/book-contributor-roles/book-contributor-roles.shared'
import { bookImagesClient } from './services/book-images/book-images.shared'
import { contributorPhotosClient } from './services/contributor-photos/contributor-photos.shared'
import { contributorSocialsClient } from './services/contributor-socials/contributor-socials.shared'
import { fileOperationsClient } from './services/file-operations/file-operations.shared'
export type {
  BookContributorRoles,
  BookContributorRolesData,
  BookContributorRolesQuery,
  BookContributorRolesPatch,
} from './services/book-contributor-roles/book-contributor-roles.shared'

export type {
  BookImages,
  BookImagesData,
  BookImagesQuery,
  BookImagesPatch,
} from './services/book-images/book-images.shared'

export type {
  ContributorPhotos,
  ContributorPhotosData,
  ContributorPhotosQuery,
  ContributorPhotosPatch,
} from './services/contributor-photos/contributor-photos.shared'

export type {
  ContributorSocials,
  ContributorSocialsData,
  ContributorSocialsQuery,
  ContributorSocialsPatch,
} from './services/contributor-socials/contributor-socials.shared'

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

import { revenueSplitOverrideClient } from './services/revenue-split-overrides/revenue-split-overrides.shared'
export type {
  RevenueSplitOverride,
  RevenueSplitOverrideData,
  RevenueSplitOverrideQuery,
  RevenueSplitOverridePatch,
} from './services/revenue-split-overrides/revenue-split-overrides.shared'

import { globalSearchClient } from './services/global-search/global-search.shared'
export type {
  GlobalSearch,
  GlobalSearchResult,
  GlobalSearchBookResult,
  GlobalSearchContributorResult,
  GlobalSearchVendorResult,
} from './services/global-search/global-search.shared'

import { marketingChecklistClient } from './services/marketing-checklists/marketing-checklists.shared'
export type {
  MarketingChecklist,
  MarketingChecklistData,
  MarketingChecklistQuery,
  MarketingChecklistPatch,
} from './services/marketing-checklists/marketing-checklists.shared'

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
  Vendor,
  VendorData,
  VendorQuery,
  VendorPatch,
} from './services/vendors/vendors.shared'

export type {
  User,
  UserData,
  UserQuery,
  UserPatch,
} from './services/users/users.shared'

export type {
  FileStorage,
  FileOperationResult,
  FileUploadData,
  FileDownloadResult,
  FileMoveData,
  GalleryQuery,
  GalleryItem,
  ChunkUploadInitData,
  ChunkUploadData,
  ChunkUploadInitResult,
  ChunkUploadResult,
  ChunkDownloadInitData,
  ChunkDownloadInitResult,
  ChunkDownloadRequest,
  ChunkDownloadResult,
} from './services/file-operations/file-operations.shared'

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
  client.configure(vendorClient)
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
  client.configure(bookImagesClient)
  client.configure(contributorPhotosClient)
  client.configure(contributorSocialsClient)
  client.configure(fileOperationsClient)
  client.configure(revenueSplitOverrideClient)
  client.configure(globalSearchClient)
  client.configure(marketingChecklistClient)
  return client
}
