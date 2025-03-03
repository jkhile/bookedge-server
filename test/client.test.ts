// For more information about this file see https://dove.feathersjs.com/guides/cli/client.test.html
import { describe, it, expect } from 'vitest'
import rest from '@feathersjs/rest-client'
import axios from 'axios'
import { createClient } from '../src/client'

describe('application client placeholder tests', () => {
  it('client can be created', () => {
    const transport = rest('http://localhost:8998').axios(axios)
    const client = createClient(transport)
    expect(client).toBeTruthy()
  })
})
