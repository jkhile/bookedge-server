import configuration from '@feathersjs/configuration'
import { feathers } from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio'
import { authentication } from './authentication'
import { channels } from './channels'
import { configurationValidator } from './configuration'
import { logError } from './hooks/log-error'
import { logServiceCall } from './hooks/log-service-call'
import { postgresql } from './postgresql'
import { services } from './services/index'
import { errorHandler } from './utils/error-handler'

// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html
import {
  bodyParser,
  cors,
  // errorHandler,
  koa,
  parseAuthentication,
  rest,
  serveStatic,
} from '@feathersjs/koa'

import type { Application } from './declarations'
import { logger } from './logger'

const app: Application = koa(feathers())

// Load our app configuration (see config/ folder)
app.configure(configuration(configurationValidator))

// Set up Koa middleware
app.use(cors())
app.use(serveStatic(app.get('public')))
app.use(errorHandler())
app.use(parseAuthentication())
app.use(bodyParser())

// Configure services and transports
app.configure(rest())
// app.configure(
//   socketio({
//     cors: {
//       origin: app.get('origins'),
//       methods: ['GET', 'POST'],
//     },
//   }),
// )
app.configure(
  socketio({
    cors: {
      origin: (origin, callback) => {
        callback(null, true)
      },
    },
  }),
)
app.configure(postgresql)
app.configure(authentication)
app.configure(services)
app.configure(channels)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.on('login', (authResult, { connection }) => {
  logger.info(
    `${authResult.authentication.strategy} login by ${authResult.user.email}`,
  )
  // record this signin in the signin-history service
  app.service('signin-history').create({
    op: 'signin',
    strategy: authResult.authentication.strategy,
    fk_user: authResult.user.id,
    user_email: authResult.user.email,
    user_name: authResult.user.name,
    datetime: new Date().toISOString(),
  })
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.on('logout', (authResult, { connection }) => {
  logger.info(
    `${authResult.authentication.strategy} logout by ${authResult.user.email}`,
  )
  // record this signout in the signin-history service
  app.service('signin-history').create({
    op: 'signout',
    strategy: authResult.authentication.strategy,
    fk_user: authResult.user.id,
    user_email: authResult.user.email,
    user_name: authResult.user.name,
    datetime: new Date().toISOString(),
  })
})

// Register hooks that run on all service methods
app.hooks({
  around: {
    all: [logServiceCall, logError],
  },
  before: {},
  after: {},
  error: {},
})
// Register application setup and teardown hooks here
app.hooks({
  setup: [],
  teardown: [],
})
export { app }
