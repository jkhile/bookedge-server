import { endorsement } from './endorsements/endorsements'
import { marketing } from './marketing/marketing'
import { logMessage } from './log-messages/log-messages'
import { pricing } from './pricing/pricing'
import { release } from './releases/releases'
import { contributor } from './contributors/contributors'
import { booksHistory } from './books-history/books-history'
import { book } from './books/books'
import { imprint } from './imprints/imprints'
import { user } from './users/users'
// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html#configure-functions
import type { Application } from '../declarations'

export const services = (app: Application) => {
  app.configure(endorsement)
  app.configure(marketing)
  app.configure(logMessage)
  app.configure(pricing)
  app.configure(release)
  app.configure(contributor)
  app.configure(booksHistory)
  app.configure(book)
  app.configure(imprint)
  app.configure(user)
  // All services will be registered here
}
