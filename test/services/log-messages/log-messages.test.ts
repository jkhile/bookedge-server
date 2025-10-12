// For more information about this file see https://dove.feathersjs.com/guides/cli/service.test.html
import assert from 'assert'
import { app } from '../../../src/app'

describe('log-messages service', () => {
  it('registered the service', () => {
    const service = app.service('log-messages')

    assert.ok(service, 'Registered the service')
  })

  it('should create a log message and return success', async () => {
    const service = app.service('log-messages')

    const logData = {
      level: 'info' as const,
      message: 'Test log message from unit test',
      source: 'client' as const,
      metadata: { test: true },
    }

    const result = await service.create(logData)

    assert.ok(result, 'Created log message')
    assert.strictEqual(result.success, true, 'Returns success')
    assert.strictEqual(result.logged, 1, 'Reports one message logged')
  })

  it('should handle log message with metadata', async () => {
    const service = app.service('log-messages')

    const logData = {
      level: 'debug' as const,
      message: 'Debug message with metadata',
      metadata: { userId: 123, action: 'test' },
    }

    const result = await service.create(logData)

    assert.ok(result, 'Created log message')
    assert.strictEqual(result.success, true, 'Returns success')
    assert.strictEqual(result.logged, 1, 'Reports one message logged')
  })

  it('should handle log message with timestamp', async () => {
    const service = app.service('log-messages')

    const logData = {
      level: 'info' as const,
      message: 'Message with timestamp',
      timestamp: new Date().toISOString(),
    }

    const result = await service.create(logData)

    assert.ok(result, 'Created log message')
    assert.strictEqual(result.success, true, 'Returns success')
    assert.strictEqual(result.logged, 1, 'Reports one message logged')
  })
})
