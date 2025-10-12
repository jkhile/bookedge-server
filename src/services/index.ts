import { bookContributorRoles } from './book-contributor-roles/book-contributor-roles'
import { refreshToken } from './refresh-token/refresh-token'
import { metadataSearch } from './metadata-search/metadata-search'
import { signinHistory } from './signin-history/signin-history'
import { mentions } from './mentions/mentions'
import { issue } from './issues/issues'
import { pricing } from './pricings/pricings'
import { endorsement } from './endorsements/endorsements'
import { logMessage } from './log-messages/log-messages'
import { release } from './releases/releases'
import { contributor } from './contributors/contributors'
import { booksHistory } from './books-history/books-history'
import { book } from './books/books'
import { imprint } from './imprints/imprints'
import { user } from './users/users'
import { fileOperations } from './file-operations/file-operations'
// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html#configure-functions
import type { Application } from '../declarations'

export const services = (app: Application) => {
  app.configure(bookContributorRoles)
  app.configure(refreshToken)
  app.configure(signinHistory)
  app.configure(mentions)
  app.configure(issue)
  app.configure(pricing)
  app.configure(endorsement)
  app.configure(logMessage)
  app.configure(release)
  app.configure(contributor)
  app.configure(booksHistory)
  app.configure(book)
  app.configure(imprint)
  app.configure(user)
  app.configure(metadataSearch)
  // File operations service (simplified - no longer depends on deprecated services)
  app.configure(fileOperations)
  // All services will be registered here
}
