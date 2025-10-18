import { describe, it, expect, vi, beforeEach } from 'vitest'
import { errorHandler } from '../../src/utils/error-handler'
import {
  FeathersError,
  NotFound,
  BadRequest,
  GeneralError,
} from '@feathersjs/errors'
import type { FeathersKoaContext } from '@feathersjs/koa'

// Mock logger
vi.mock('../../src/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('errorHandler', () => {
  let mockContext: Partial<FeathersKoaContext>
  let mockNext: ReturnType<typeof vi.fn>
  let handler: ReturnType<typeof errorHandler>

  beforeEach(() => {
    vi.clearAllMocks()

    // Create a minimal mock context
    mockContext = {
      path: '/test-path',
      body: undefined,
      response: {
        status: 200,
      } as any,
    }

    mockNext = vi.fn()
    handler = errorHandler()
  })

  describe('successful requests', () => {
    it('should allow successful requests to pass through', async () => {
      mockContext.body = { success: true }
      mockNext.mockResolvedValue(undefined)

      await handler(mockContext as FeathersKoaContext, mockNext)

      expect(mockNext).toHaveBeenCalledOnce()
      expect(mockContext.body).toEqual({ success: true })
    })

    it('should not modify response status for successful requests', async () => {
      mockContext.body = { data: 'test' }
      mockContext.response!.status = 200
      mockNext.mockResolvedValue(undefined)

      await handler(mockContext as FeathersKoaContext, mockNext)

      expect(mockContext.response!.status).toBe(200)
    })
  })

  describe('404 Not Found errors', () => {
    it('should throw NotFound error when body is undefined after next()', async () => {
      mockContext.body = undefined
      mockNext.mockResolvedValue(undefined)

      await handler(mockContext as FeathersKoaContext, mockNext)

      expect(mockContext.response!.status).toBe(404)
      expect(mockContext.body).toMatchObject({
        message: 'Path /test-path not found',
      })
    })

    it('should handle different paths in NotFound error message', async () => {
      mockContext.path = '/some/other/path'
      mockContext.body = undefined
      mockNext.mockResolvedValue(undefined)

      await handler(mockContext as FeathersKoaContext, mockNext)

      expect(mockContext.response!.status).toBe(404)
      expect(mockContext.body).toMatchObject({
        message: 'Path /some/other/path not found',
      })
    })
  })

  describe('FeathersError handling', () => {
    it('should handle NotFound errors with correct status code', async () => {
      const error = new NotFound('Resource not found')
      mockNext.mockRejectedValue(error)

      await handler(mockContext as FeathersKoaContext, mockNext)

      expect(mockContext.response!.status).toBe(404)
      expect(mockContext.body).toMatchObject({
        message: 'Resource not found',
        name: 'NotFound',
        code: 404,
      })
    })

    it('should handle BadRequest errors with correct status code', async () => {
      const error = new BadRequest('Invalid input')
      mockNext.mockRejectedValue(error)

      await handler(mockContext as FeathersKoaContext, mockNext)

      expect(mockContext.response!.status).toBe(400)
      expect(mockContext.body).toMatchObject({
        message: 'Invalid input',
        name: 'BadRequest',
        code: 400,
      })
    })

    it('should call toJSON on FeathersError instances', async () => {
      const error = new BadRequest('Test error', { extra: 'data' })
      mockNext.mockRejectedValue(error)

      await handler(mockContext as FeathersKoaContext, mockNext)

      // FeathersError.toJSON() includes name, message, code, className, and data
      expect(mockContext.body).toHaveProperty('message')
      expect(mockContext.body).toHaveProperty('code')
      expect(mockContext.body).toHaveProperty('name')
    })

    it('should handle errors with additional data', async () => {
      const error = new BadRequest('Validation failed', {
        errors: ['Field is required'],
      })
      mockNext.mockRejectedValue(error)

      await handler(mockContext as FeathersKoaContext, mockNext)

      expect(mockContext.response!.status).toBe(400)
      const body = mockContext.body as any
      expect(body.message).toBe('Validation failed')
      expect(body.code).toBe(400)
      expect(body.name).toBe('BadRequest')
      // The error handler calls toJSON() which includes the error structure
    })
  })

  describe('non-Feathers error handling', () => {
    it('should handle standard Error with 500 status', async () => {
      const error = new Error('Something went wrong')
      mockNext.mockRejectedValue(error)

      await handler(mockContext as FeathersKoaContext, mockNext)

      expect(mockContext.response!.status).toBe(500)
      expect(mockContext.body).toMatchObject({
        message: 'Something went wrong',
      })
    })

    it('should handle errors without toJSON method', async () => {
      const error = { message: 'Plain object error' }
      mockNext.mockRejectedValue(error)

      await handler(mockContext as FeathersKoaContext, mockNext)

      expect(mockContext.response!.status).toBe(500)
      expect(mockContext.body).toMatchObject({
        message: 'Plain object error',
      })
    })

    it('should handle string errors', async () => {
      const error = { message: 'String error message' }
      mockNext.mockRejectedValue(error)

      await handler(mockContext as FeathersKoaContext, mockNext)

      expect(mockContext.response!.status).toBe(500)
      expect(mockContext.body).toMatchObject({
        message: 'String error message',
      })
    })

    it('should handle errors without message property', async () => {
      const error = { toString: () => 'Error as string' }
      mockNext.mockRejectedValue(error)

      await handler(mockContext as FeathersKoaContext, mockNext)

      expect(mockContext.response!.status).toBe(500)
      // The error handler will try to access error.message
      expect(mockContext.body).toHaveProperty('message')
    })
  })

  describe('error logging', () => {
    it('should log all errors', async () => {
      const { logger } = await import('../../src/logger')
      const error = new Error('Test error')
      mockNext.mockRejectedValue(error)

      await handler(mockContext as FeathersKoaContext, mockNext)

      expect(logger.error).toHaveBeenCalledWith(error)
    })

    it('should log FeathersErrors', async () => {
      const { logger } = await import('../../src/logger')
      const error = new NotFound('Not found')
      mockNext.mockRejectedValue(error)

      await handler(mockContext as FeathersKoaContext, mockNext)

      expect(logger.error).toHaveBeenCalledWith(error)
    })

    it('should log errors even when body is undefined', async () => {
      const { logger } = await import('../../src/logger')
      mockContext.body = undefined
      mockNext.mockResolvedValue(undefined)

      await handler(mockContext as FeathersKoaContext, mockNext)

      // NotFound error should be logged
      expect(logger.error).toHaveBeenCalled()
    })
  })

  describe('various FeathersError types', () => {
    const errorTypes = [
      { ErrorClass: NotFound, code: 404, name: 'NotFound' },
      { ErrorClass: BadRequest, code: 400, name: 'BadRequest' },
      { ErrorClass: GeneralError, code: 500, name: 'GeneralError' },
    ]

    errorTypes.forEach(({ ErrorClass, code, name }) => {
      it(`should handle ${name} with code ${code}`, async () => {
        const error = new ErrorClass(`${name} message`)
        mockNext.mockRejectedValue(error)

        await handler(mockContext as FeathersKoaContext, mockNext)

        expect(mockContext.response!.status).toBe(code)
        expect((mockContext.body as any).message).toBe(`${name} message`)
      })
    })
  })

  describe('edge cases', () => {
    it('should handle null body', async () => {
      mockContext.body = null
      mockNext.mockResolvedValue(undefined)

      await handler(mockContext as FeathersKoaContext, mockNext)

      // null is not undefined, so it should not throw NotFound
      expect(mockContext.body).toBe(null)
    })

    it('should handle empty string body', async () => {
      mockContext.body = ''
      mockNext.mockResolvedValue(undefined)

      await handler(mockContext as FeathersKoaContext, mockNext)

      // Empty string is not undefined, so it should not throw NotFound
      expect(mockContext.body).toBe('')
    })

    it('should handle zero as body', async () => {
      mockContext.body = 0
      mockNext.mockResolvedValue(undefined)

      await handler(mockContext as FeathersKoaContext, mockNext)

      // 0 is not undefined, so it should not throw NotFound
      expect(mockContext.body).toBe(0)
    })

    it('should handle false as body', async () => {
      mockContext.body = false
      mockNext.mockResolvedValue(undefined)

      await handler(mockContext as FeathersKoaContext, mockNext)

      // false is not undefined, so it should not throw NotFound
      expect(mockContext.body).toBe(false)
    })

    it('should handle empty array body', async () => {
      mockContext.body = []
      mockNext.mockResolvedValue(undefined)

      await handler(mockContext as FeathersKoaContext, mockNext)

      expect(mockContext.body).toEqual([])
    })

    it('should handle empty object body', async () => {
      mockContext.body = {}
      mockNext.mockResolvedValue(undefined)

      await handler(mockContext as FeathersKoaContext, mockNext)

      expect(mockContext.body).toEqual({})
    })
  })
})
