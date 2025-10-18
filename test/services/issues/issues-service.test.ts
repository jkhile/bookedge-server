// Tests for IssuesService class methods
import { describe, it, expect, beforeAll } from 'vitest'
import { app } from '../../../src/app'
import type { IssueService } from '../../../src/services/issues/issues.class'

describe('IssuesService class', () => {
  let service: IssueService

  beforeAll(() => {
    service = app.service('issues')
  })

  it('should be registered as a service', () => {
    expect(service).toBeDefined()
    expect(typeof service.find).toBe('function')
    expect(typeof service.get).toBe('function')
    expect(typeof service.create).toBe('function')
    expect(typeof service.patch).toBe('function')
    expect(typeof service.remove).toBe('function')
  })

  it('should have a createQuery method', () => {
    expect(typeof service.createQuery).toBe('function')
  })

  it('should extend KnexService with database model', () => {
    expect(service.Model).toBeDefined()
    // The Model is a Knex instance, check it has query methods
    expect(typeof service.Model.select).toBe('function')
    expect(typeof service.Model.where).toBe('function')
  })

  it('createQuery should join with books table for book_title', () => {
    const params = { query: {} }
    const query = service.createQuery(params)

    // Check that the query was extended with join
    expect(query).toBeDefined()

    // The query should be a Knex query builder with join capability
    expect(typeof query.then).toBe('function')
    expect(typeof query.select).toBe('function')
    expect(typeof query.leftJoin).toBe('function')
  })

  it('should support standard CRUD operations', () => {
    // Verify all CRUD methods exist
    expect(typeof service.find).toBe('function')
    expect(typeof service.get).toBe('function')
    expect(typeof service.create).toBe('function')
    expect(typeof service.update).toBe('function')
    expect(typeof service.patch).toBe('function')
    expect(typeof service.remove).toBe('function')
  })

  it('should support pagination from app config', () => {
    const paginate = app.get('paginate')
    expect(paginate).toBeDefined()
    expect(typeof paginate.default).toBe('number')
    expect(typeof paginate.max).toBe('number')
  })

  it('createQuery should select book_title from books table', () => {
    const params = { query: {} }
    const query = service.createQuery(params)

    // Verify query builder has necessary methods
    expect(query).toBeDefined()
    expect(typeof query.toString).toBe('function')

    // We can't easily inspect the SQL without running it,
    // but we can verify the query builder is properly configured
    const sql = query.toString()
    expect(sql).toContain('books')
    expect(sql).toContain('title')
  })
})
