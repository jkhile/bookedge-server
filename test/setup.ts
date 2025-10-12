// Setup file for Vitest
import { afterAll, beforeAll } from 'vitest'

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.HOST = 'localhost'
process.env.PORT = '8998'
process.env.DATABASE_URL =
  'postgres://johnhile:@localhost:5432/bookedge-test'
process.env.FEATHERS_SECRET = 'AI6P8NFOCSW637jKfeo1jVGke57cIEgX'
process.env.CORALOGIX_LOGGER = 'false'

// Global setup hooks
beforeAll(async () => {
  console.info('Starting test server...')
})

afterAll(async () => {
  console.info('Cleaning up test resources...')
})
