// Setup file for Vitest
import { afterAll, beforeAll } from 'vitest'

// Set environment
process.env.NODE_ENV = 'test'
process.env.HOST = 'localhost'
process.env.PORT = '8998'

// Global setup hooks
beforeAll(async () => {
  console.info('Starting test server...')
})

afterAll(async () => {
  console.info('Cleaning up test resources...')
})
