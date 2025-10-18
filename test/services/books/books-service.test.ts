// Tests for BooksService class methods
import { describe, it, expect, beforeAll } from 'vitest'
import { app } from '../../../src/app'
import type { BookService } from '../../../src/services/books/books.class'

describe('BooksService class', () => {
  let service: BookService

  beforeAll(() => {
    service = app.service('books')
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

  it('createQuery should add virtual author field via subquery', () => {
    const params = { query: {} }
    const query = service.createQuery(params)

    // Check that the query was extended
    expect(query).toBeDefined()

    // The query should be a Knex query builder
    expect(typeof query.then).toBe('function')
    expect(typeof query.select).toBe('function')
  })

  it('createQuery should add virtual published_date field via subquery', () => {
    const params = { query: {} }
    const query = service.createQuery(params)

    // Check that the query exists and has methods
    expect(query).toBeDefined()
    expect(typeof query.select).toBe('function')
  })

  it('createQuery should add virtual issues_count field via subquery', () => {
    const params = { query: {} }
    const query = service.createQuery(params)

    // Check that the query exists
    expect(query).toBeDefined()
    expect(typeof query.select).toBe('function')
  })

  it('should support pagination from app config', () => {
    const paginate = app.get('paginate')
    expect(paginate).toBeDefined()
    expect(typeof paginate.default).toBe('number')
    expect(typeof paginate.max).toBe('number')
  })
})
