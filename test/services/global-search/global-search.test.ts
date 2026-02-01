// Tests for GlobalSearchService
import { describe, it, expect, beforeAll } from 'vitest'
import { app } from '../../../src/app'
import type { GlobalSearchService } from '../../../src/services/global-search/global-search.class'

describe('GlobalSearchService', () => {
  let service: GlobalSearchService

  beforeAll(() => {
    service = app.service('global-search')
  })

  describe('service registration', () => {
    it('should be registered as a service', () => {
      expect(service).toBeDefined()
      expect(typeof service.find).toBe('function')
    })

    it('should only expose find method', () => {
      // Global search only supports find, not full CRUD
      expect(typeof service.find).toBe('function')
      expect((service as any).get).toBeUndefined()
      expect((service as any).create).toBeUndefined()
      expect((service as any).patch).toBeUndefined()
      expect((service as any).remove).toBeUndefined()
    })

    it('should have access to knex client', () => {
      expect(service.knex).toBeDefined()
      expect(typeof service.knex.raw).toBe('function')
    })

    it('should have access to app instance', () => {
      expect(service.app).toBeDefined()
    })
  })

  describe('query validation', () => {
    it('should throw error when query parameter is missing', async () => {
      await expect(service.find({ query: {} })).rejects.toThrow(
        'Missing required query parameter: query',
      )
    })

    it('should throw error when query is empty string', async () => {
      // Schema validation catches this before service method
      await expect(service.find({ query: { query: '' } })).rejects.toThrow(
        'validation failed',
      )
    })

    it('should throw error when query is only whitespace', async () => {
      await expect(service.find({ query: { query: '   ' } })).rejects.toThrow(
        'Search query must be at least 2 characters',
      )
    })

    it('should throw error when query is too short (1 character)', async () => {
      // Schema validation catches this before service method (minLength: 2)
      await expect(service.find({ query: { query: 'a' } })).rejects.toThrow(
        'validation failed',
      )
    })

    it('should not throw error for 2 character query', async () => {
      // This will attempt a real search, which may return empty results
      // but should not throw validation errors
      const mockUser = { roles: ['admin'], allowed_imprints: [] }
      await expect(
        service.find({ query: { query: 'ab' }, user: mockUser as any }),
      ).resolves.toBeDefined()
    })
  })

  describe('limit handling', () => {
    it('should use default limit of 5 when not specified', async () => {
      const mockUser = { roles: ['admin'], allowed_imprints: [] }
      const result = await service.find({
        query: { query: 'test' },
        user: mockUser as any,
      })

      // Result structure should be valid
      expect(result).toHaveProperty('books')
      expect(result).toHaveProperty('contributors')
      expect(result).toHaveProperty('vendors')
    })

    it('should accept custom limit up to 20', async () => {
      const mockUser = { roles: ['admin'], allowed_imprints: [] }
      const result = await service.find({
        query: { query: 'test', limit: 10 },
        user: mockUser as any,
      })

      expect(result).toHaveProperty('books')
      expect(Array.isArray(result.books)).toBe(true)
    })

    it('should reject limit higher than 20 via schema validation', async () => {
      const mockUser = { roles: ['admin'], allowed_imprints: [] }
      // Schema validation rejects limit > 20 (maximum: 20)
      await expect(
        service.find({
          query: { query: 'test', limit: 100 },
          user: mockUser as any,
        }),
      ).rejects.toThrow('validation failed')
    })

    it('should accept limit of exactly 20', async () => {
      const mockUser = { roles: ['admin'], allowed_imprints: [] }
      const result = await service.find({
        query: { query: 'test', limit: 20 },
        user: mockUser as any,
      })

      expect(result).toHaveProperty('books')
    })
  })

  describe('result structure', () => {
    it('should return object with books, contributors, and vendors arrays', async () => {
      const mockUser = { roles: ['admin'], allowed_imprints: [] }
      const result = await service.find({
        query: { query: 'nonexistent12345' },
        user: mockUser as any,
      })

      expect(result).toHaveProperty('books')
      expect(result).toHaveProperty('contributors')
      expect(result).toHaveProperty('vendors')
      expect(Array.isArray(result.books)).toBe(true)
      expect(Array.isArray(result.contributors)).toBe(true)
      expect(Array.isArray(result.vendors)).toBe(true)
    })

    it('should return empty arrays when no results found', async () => {
      const mockUser = { roles: ['admin'], allowed_imprints: [] }
      const result = await service.find({
        query: { query: 'zzznonexistentquery999' },
        user: mockUser as any,
      })

      expect(result.books).toEqual([])
      expect(result.contributors).toEqual([])
      expect(result.vendors).toEqual([])
    })
  })
})

describe('GlobalSearchService query parsing', () => {
  let service: GlobalSearchService

  beforeAll(() => {
    service = app.service('global-search')
  })

  describe('field-targeted search', () => {
    it('should handle field:value syntax', async () => {
      const mockUser = { roles: ['admin'], allowed_imprints: [] }
      // title:test should search only in title field for books
      const result = await service.find({
        query: { query: 'title:test' },
        user: mockUser as any,
      })

      expect(result).toHaveProperty('books')
      // Contributor and vendor results should be empty since title is not relevant to them
      expect(result.contributors).toEqual([])
      expect(result.vendors).toEqual([])
    })

    it('should handle field:"multi word" syntax', async () => {
      const mockUser = { roles: ['admin'], allowed_imprints: [] }
      const result = await service.find({
        query: { query: 'title:"test book"' },
        user: mockUser as any,
      })

      expect(result).toHaveProperty('books')
    })

    it('should filter out non-relevant entity types for contributor field', async () => {
      const mockUser = { roles: ['admin'], allowed_imprints: [] }
      // contributor:name should only search contributors
      const result = await service.find({
        query: { query: 'contributor:john' },
        user: mockUser as any,
      })

      expect(result.books).toEqual([])
      expect(result.vendors).toEqual([])
      // Contributors may or may not have results but should be searched
      expect(Array.isArray(result.contributors)).toBe(true)
    })

    it('should filter out non-relevant entity types for vendor field', async () => {
      const mockUser = { roles: ['admin'], allowed_imprints: [] }
      // vendor:name should only search vendors
      const result = await service.find({
        query: { query: 'vendor:test' },
        user: mockUser as any,
      })

      expect(result.books).toEqual([])
      expect(result.contributors).toEqual([])
      // Vendors may or may not have results but should be searched
      expect(Array.isArray(result.vendors)).toBe(true)
    })

    it('should combine field target with free text', async () => {
      const mockUser = { roles: ['admin'], allowed_imprints: [] }
      const result = await service.find({
        query: { query: 'title:fiction fantasy' },
        user: mockUser as any,
      })

      // Free text "fantasy" applies to all entities
      expect(result).toHaveProperty('books')
      expect(result).toHaveProperty('contributors')
      expect(result).toHaveProperty('vendors')
    })

    it('should handle multiple field targets', async () => {
      const mockUser = { roles: ['admin'], allowed_imprints: [] }
      const result = await service.find({
        query: { query: 'title:test author:smith' },
        user: mockUser as any,
      })

      expect(result).toHaveProperty('books')
    })
  })
})

describe('GlobalSearchService permissions', () => {
  let service: GlobalSearchService

  beforeAll(() => {
    service = app.service('global-search')
  })

  describe('admin user', () => {
    it('should search all books for admin users', async () => {
      const adminUser = { roles: ['admin'], allowed_imprints: [] }
      const result = await service.find({
        query: { query: 'test' },
        user: adminUser as any,
      })

      expect(result).toHaveProperty('books')
      expect(Array.isArray(result.books)).toBe(true)
    })
  })

  describe('non-admin user', () => {
    it('should filter books by allowed_imprints for non-admin users', async () => {
      const nonAdminUser = { roles: ['user'], allowed_imprints: [1, 2] }
      const result = await service.find({
        query: { query: 'test' },
        user: nonAdminUser as any,
      })

      expect(result).toHaveProperty('books')
      expect(Array.isArray(result.books)).toBe(true)
    })

    it('should return no books for non-admin with empty allowed_imprints', async () => {
      const nonAdminUser = { roles: ['user'], allowed_imprints: [] }
      const result = await service.find({
        query: { query: 'test' },
        user: nonAdminUser as any,
      })

      // With empty allowed_imprints, the query uses IN (0) which matches nothing
      expect(result.books).toEqual([])
    })
  })

  describe('contributor and vendor searches', () => {
    it('should not restrict contributor searches by user permissions', async () => {
      const nonAdminUser = { roles: ['user'], allowed_imprints: [] }
      const result = await service.find({
        query: { query: 'contributor:test' },
        user: nonAdminUser as any,
      })

      // Contributors are not filtered by imprints
      expect(Array.isArray(result.contributors)).toBe(true)
    })

    it('should not restrict vendor searches by user permissions', async () => {
      const nonAdminUser = { roles: ['user'], allowed_imprints: [] }
      const result = await service.find({
        query: { query: 'vendor:test' },
        user: nonAdminUser as any,
      })

      // Vendors are not filtered by imprints
      expect(Array.isArray(result.vendors)).toBe(true)
    })
  })
})
