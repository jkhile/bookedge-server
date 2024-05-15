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
        // eslint-disable-next-line unicorn/no-null
        callback(null, true)
      },
    },
  }),
)
app.configure(postgresql)
app.configure(authentication)
app.configure(services)
app.configure(channels)

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
