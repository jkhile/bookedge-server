import { issue } from './issues/issues'
import { marketing } from './marketings/marketings'
import { pricing } from './pricings/pricings'
import { endorsement } from './endorsements/endorsements'
import { logMessage } from './log-messages/log-messages'
import { release } from './releases/releases'
import { contributor } from './contributors/contributors'
import { booksHistory } from './books-history/books-history'
import { book } from './books/books'
import { imprint } from './imprints/imprints'
import { user } from './users/users'
// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html#configure-functions
import type { Application } from '../declarations'

export const services = (app: Application) => {
  app.configure(issue)
  app.configure(marketing)
  app.configure(pricing)
  app.configure(endorsement)
  app.configure(logMessage)
  app.configure(release)
  app.configure(contributor)
  app.configure(booksHistory)
  app.configure(book)
  app.configure(imprint)
  app.configure(user)
  // All services will be registered here
}
