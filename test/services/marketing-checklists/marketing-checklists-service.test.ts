// Tests for MarketingChecklistService class methods
import { describe, it, expect, beforeAll } from 'vitest'
import { app } from '../../../src/app'
import type { MarketingChecklistService } from '../../../src/services/marketing-checklists/marketing-checklists.class'

describe('MarketingChecklistService class', () => {
  let service: MarketingChecklistService

  beforeAll(() => {
    service = app.service('marketing-checklists')
  })

  it('should be registered as a service', () => {
    expect(service).toBeDefined()
    expect(typeof service.find).toBe('function')
    expect(typeof service.get).toBe('function')
    expect(typeof service.create).toBe('function')
    expect(typeof service.patch).toBe('function')
    expect(typeof service.remove).toBe('function')
  })

  it('should extend KnexService with database model', () => {
    expect(service.Model).toBeDefined()
    // The Model is a Knex instance, check it has query methods
    expect(typeof service.Model.select).toBe('function')
    expect(typeof service.Model.where).toBe('function')
  })

  it('should target the marketing_checklists table', () => {
    const params = { query: {} }
    const sql = service.createQuery(params).toString()
    expect(sql).toContain('marketing_checklists')
  })

  it('should support pagination from app config', () => {
    const paginate = app.get('paginate')
    expect(paginate).toBeDefined()
    expect(typeof paginate.default).toBe('number')
    expect(typeof paginate.max).toBe('number')
  })

  it('should use standard KnexService createQuery', () => {
    const params = { query: {} }
    const query = service.createQuery(params)

    expect(query).toBeDefined()
    expect(typeof query.select).toBe('function')
    expect(typeof query.where).toBe('function')

    // Should query the marketing_checklists table
    const sql = query.toString()
    expect(sql).toContain('marketing_checklists')
  })
})
