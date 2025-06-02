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

  it('should handle array of log messages', async () => {
    const service = app.service('log-messages')

    const logData = [
      {
        level: 'debug' as const,
        message: 'Debug message',
      },
      {
        level: 'warn' as const,
        message: 'Warning message',
      },
    ]

    const result = await service.create(logData)

    assert.ok(result, 'Created log messages')
    assert.strictEqual(result.success, true, 'Returns success')
    assert.strictEqual(result.logged, 2, 'Reports two messages logged')
  })

  it('should reject oversized batches', async () => {
    const service = app.service('log-messages')

    const logData = Array(101).fill({
      level: 'info' as const,
      message: 'Test message',
    })

    try {
      await service.create(logData)
      assert.fail('Should have thrown an error')
    } catch (error) {
      assert.ok(
        error.message.includes('Cannot create more than 100'),
        'Rejects large batches',
      )
    }
  })
})
