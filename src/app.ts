import configuration from '@feathersjs/configuration'
import { feathers } from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio'
import { authentication } from './authentication'
import { channels } from './channels'
import { configurationValidator } from './configuration'
import { googleDrive } from './google-drive'
import { logError } from './hooks/log-error'
import { logServiceCall } from './hooks/log-service-call'
// import { measurePerformance } from './hooks/measure-performance'
import { postgresql } from './postgresql'
import { services } from './services/index'
import { errorHandler } from './utils/error-handler'
import debug from 'debug'

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
feathers.setDebug(debug)
const app: Application = koa(feathers())

// Load our app configuration (see config/ folder)
app.configure(configuration(configurationValidator))

// Set up Koa middleware
app.use(
  cors({
    origin: function (ctx) {
      const requestOrigin = ctx.request.header.origin || ''
      const origins = app.get('origins') as string[]
      if (origins.includes(requestOrigin)) {
        return requestOrigin
      }
      return ''
    },
    credentials: true,
  }),
)
app.use(serveStatic(app.get('public')))
app.use(errorHandler())
app.use(parseAuthentication())
app.use(bodyParser())

// Configure services and transports
app.configure(rest())
app.configure(
  socketio(
    {
      cors: {
        origin: function (origin, callback) {
          const origins = app.get('origins') as string[]
          if (!origin || origins.includes(origin)) {
            callback(null, true)
          } else {
            logger.error('cors callback returning error')
            callback(new Error(`Origin ${origin} not allowed by CORS`))
          }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
    },
    (io) => {
      // Add logging middleware for incoming Socket.IO events
      io.use((socket, next) => {
        logger.info(
          `[Socket.IO] New connection: ${socket.id} from ${socket.handshake.address}`,
        )

        // Store original event handler registration method
        const originalOn = socket.on.bind(socket)

        // Override socket.on to wrap event handlers with logging
        socket.on = function (
          event: string,
          handler: (...args: any[]) => void,
        ) {
          const wrappedHandler = (...args: any[]) => {
            // Extract callback function if present (usually last argument)
            const hasCallback =
              args.length > 0 && typeof args[args.length - 1] === 'function'
            const logArgs = hasCallback ? args.slice(0, -1) : args

            logger.info(`[Socket.IO] Incoming event: ${event}`, {
              socketId: socket.id,
              args: logArgs,
              timestamp: new Date().toISOString(),
              argCount: args.length,
            })
            if (args[0] === 'book-contributors') {
              logger.info(`app.services: ${Object.keys(app.services)}`)
            }

            return handler.apply(this, args)
          }
          return originalOn(event, wrappedHandler)
        }

        // Log disconnection
        socket.on('disconnect', (reason) => {
          logger.info(
            `[Socket.IO] Disconnection: ${socket.id}, reason: ${reason}`,
          )
        })

        next()
      })
    },
  ),
)
app.configure(postgresql)
app.configure(googleDrive)
app.configure(authentication)
app.configure(services)
app.configure(channels)

// Debug: Log all registered services
console.log('Registered services:', Object.keys(app.services).sort())

// Debug endpoint to test service availability
app.use(async (ctx, next) => {
  if (ctx.path === '/debug/services' && ctx.method === 'GET') {
    const services = Object.keys(app.services).sort()
    const bookContributorsExists = services.includes('book-contributors')
    ctx.body = {
      totalServices: services.length,
      services: services,
      bookContributorsExists: bookContributorsExists,
      bookContributorsServiceDirect: app.service('book-contributors')
        ? 'accessible'
        : 'not accessible',
    }
  } else {
    await next()
  }
})

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
    // all: [measurePerformance({ minDuration: 1 }), logServiceCall, logError],
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
