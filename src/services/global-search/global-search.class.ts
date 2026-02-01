// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import { logger } from '../../logger'
import type { Knex } from 'knex'
import type { Params, ServiceInterface } from '@feathersjs/feathers'
import type { Application } from '../../declarations'
import type {
  GlobalSearch,
  GlobalSearchResult,
  GlobalSearchBookResult,
  GlobalSearchContributorResult,
  GlobalSearchVendorResult,
} from './global-search.schema'

export type {
  GlobalSearch,
  GlobalSearchResult,
  GlobalSearchBookResult,
  GlobalSearchContributorResult,
  GlobalSearchVendorResult,
}

export interface GlobalSearchParams extends Params {
  query?: {
    query?: string
    limit?: number
  }
}

/**
 * Field alias mapping for field-targeted searches
 * Maps user-friendly aliases to actual database columns per entity type
 */
const FIELD_ALIASES: Record<string, Record<string, string[]>> = {
  book: {
    title: ['title'],
    author: ['author'],
    isbn: ['isbn_paperback', 'isbn_hardcover', 'isbn_epub', 'isbn_ibooks'],
    code: ['accounting_code'],
    imprint: ['imprint'],
  },
  contributor: {
    contributor: ['published_name', 'legal_name'],
    name: ['published_name', 'legal_name'],
  },
  vendor: {
    vendor: ['vendor_name'],
    name: ['vendor_name'],
    code: ['code_prefix'],
  },
}

/**
 * Parse search query for field targeting syntax
 * Supports: `field:value` and `field:"multi word value"`
 */
function parseSearchQuery(query: string): {
  fields: Record<string, string>
  freeText: string
} {
  const fields: Record<string, string> = {}
  let remaining = query

  const FIELD_PATTERN = /(\w+):(?:"([^"]+)"|(\S+))/g
  let match: RegExpExecArray | null

  while ((match = FIELD_PATTERN.exec(query)) !== null) {
    const fieldName = match[1].toLowerCase()
    const value = match[2] || match[3]
    if (value) {
      fields[fieldName] = value.trim()
    }
    remaining = remaining.replace(match[0], ' ')
  }

  const freeText = remaining.replace(/\s+/g, ' ').trim()
  return { fields, freeText }
}

/**
 * Check if field alias is relevant for a given entity type
 */
function isFieldRelevantForEntity(
  fieldAlias: string,
  entityType: 'book' | 'contributor' | 'vendor',
): boolean {
  return fieldAlias in FIELD_ALIASES[entityType]
}

// This is a custom service that doesn't extend KnexService directly since we don't
// need to persist data. It just implements the ServiceInterface
export class GlobalSearchService implements ServiceInterface<
  GlobalSearchResult,
  GlobalSearch
> {
  app: Application
  knex: Knex

  constructor(app: Application) {
    this.app = app
    this.knex = app.get('postgresqlClient')
  }

  /**
   * Search across books, contributors, and vendors
   */
  async find(params?: GlobalSearchParams): Promise<GlobalSearchResult> {
    if (!params?.query?.query) {
      throw new Error('Missing required query parameter: query')
    }

    const searchQuery = params.query.query.trim()
    const limit = Math.min(params.query.limit || 5, 20)

    if (searchQuery.length < 2) {
      throw new Error('Search query must be at least 2 characters')
    }

    // Parse for field targeting
    const parsed = parseSearchQuery(searchQuery)
    const hasFieldTargets = Object.keys(parsed.fields).length > 0

    // Get user information for permission check
    const user = params?.user
    const isAdmin = user?.roles.includes('admin')
    const allowedImprints = user?.allowed_imprints

    // Execute searches in parallel
    const [books, contributors, vendors] = await Promise.all([
      this.searchBooks(
        parsed,
        hasFieldTargets,
        limit,
        isAdmin,
        allowedImprints,
      ),
      this.searchContributors(parsed, hasFieldTargets, limit),
      this.searchVendors(parsed, hasFieldTargets, limit),
    ])

    return { books, contributors, vendors }
  }

  /**
   * Search books with optional field targeting
   */
  private async searchBooks(
    parsed: { fields: Record<string, string>; freeText: string },
    hasFieldTargets: boolean,
    limit: number,
    isAdmin?: boolean,
    allowedImprints?: number[],
  ): Promise<GlobalSearchBookResult[]> {
    // Skip if field targets don't include book-relevant fields
    if (hasFieldTargets) {
      const hasBookFields = Object.keys(parsed.fields).some((field) =>
        isFieldRelevantForEntity(field, 'book'),
      )
      if (!hasBookFields && !parsed.freeText) {
        return []
      }
    }

    // Build search term from relevant fields + free text
    const searchTerms: string[] = []
    if (hasFieldTargets) {
      for (const [field, value] of Object.entries(parsed.fields)) {
        if (isFieldRelevantForEntity(field, 'book')) {
          searchTerms.push(value)
        }
      }
    }
    if (parsed.freeText) {
      searchTerms.push(parsed.freeText)
    }
    const searchTerm = searchTerms.join(' ')

    if (!searchTerm) {
      return []
    }

    // Build the imprints access control phrase
    const imprintsPhrase = isAdmin
      ? ''
      : `AND fk_imprint IN (${allowedImprints?.join(', ') || '0'})`

    // Determine which fields to search based on field targets
    let searchFields = 'title, author, accounting_code, imprint'
    if (hasFieldTargets) {
      const columns = new Set<string>()
      for (const field of Object.keys(parsed.fields)) {
        const fieldCols = FIELD_ALIASES.book[field]
        if (fieldCols) {
          fieldCols.forEach((col) => columns.add(col))
        }
      }
      if (columns.size > 0) {
        searchFields = Array.from(columns).join(', ')
      }
    }

    const sql = `
      SELECT id, title, author, accounting_code, imprint
      FROM books
      WHERE to_tsvector('english', concat_ws(' ', ${searchFields})) @@ websearch_to_tsquery('english', ?)
      ${imprintsPhrase}
      ORDER BY ts_rank_cd(to_tsvector('english', concat_ws(' ', ${searchFields})), websearch_to_tsquery('english', ?)) DESC
      LIMIT ?;
    `

    try {
      const result = await this.knex.raw(sql, [searchTerm, searchTerm, limit])
      return result.rows
    } catch (error) {
      logger.error('Error searching books:', error)
      return []
    }
  }

  /**
   * Search contributors with optional field targeting
   */
  private async searchContributors(
    parsed: { fields: Record<string, string>; freeText: string },
    hasFieldTargets: boolean,
    limit: number,
  ): Promise<GlobalSearchContributorResult[]> {
    // Skip if field targets exist and don't include contributor-relevant fields
    if (hasFieldTargets) {
      const hasContributorFields = Object.keys(parsed.fields).some((field) =>
        isFieldRelevantForEntity(field, 'contributor'),
      )
      if (!hasContributorFields && !parsed.freeText) {
        return []
      }
    }

    // Build search term
    const searchTerms: string[] = []
    if (hasFieldTargets) {
      for (const [field, value] of Object.entries(parsed.fields)) {
        if (isFieldRelevantForEntity(field, 'contributor')) {
          searchTerms.push(value)
        }
      }
    }
    if (parsed.freeText) {
      searchTerms.push(parsed.freeText)
    }
    const searchTerm = searchTerms.join(' ')

    if (!searchTerm) {
      return []
    }

    // Search contributors and include a book_id for navigation using a subquery
    const sql = `
      SELECT
        c.id,
        c.published_name,
        c.legal_name,
        (SELECT fk_book FROM "book-contributor-roles" WHERE fk_contributor = c.id LIMIT 1) as book_id
      FROM contributors c
      WHERE to_tsvector('english', concat_ws(' ', c.published_name, c.legal_name)) @@ websearch_to_tsquery('english', ?)
      ORDER BY ts_rank_cd(to_tsvector('english', concat_ws(' ', c.published_name, c.legal_name)), websearch_to_tsquery('english', ?)) DESC
      LIMIT ?;
    `

    try {
      const result = await this.knex.raw(sql, [searchTerm, searchTerm, limit])
      return result.rows
    } catch (error) {
      logger.error('Error searching contributors:', error)
      return []
    }
  }

  /**
   * Search vendors with optional field targeting
   */
  private async searchVendors(
    parsed: { fields: Record<string, string>; freeText: string },
    hasFieldTargets: boolean,
    limit: number,
  ): Promise<GlobalSearchVendorResult[]> {
    // Skip if field targets exist and don't include vendor-relevant fields
    if (hasFieldTargets) {
      const hasVendorFields = Object.keys(parsed.fields).some((field) =>
        isFieldRelevantForEntity(field, 'vendor'),
      )
      if (!hasVendorFields && !parsed.freeText) {
        return []
      }
    }

    // Build search term
    const searchTerms: string[] = []
    if (hasFieldTargets) {
      for (const [field, value] of Object.entries(parsed.fields)) {
        if (isFieldRelevantForEntity(field, 'vendor')) {
          searchTerms.push(value)
        }
      }
    }
    if (parsed.freeText) {
      searchTerms.push(parsed.freeText)
    }
    const searchTerm = searchTerms.join(' ')

    if (!searchTerm) {
      return []
    }

    const sql = `
      SELECT id, vendor_name, code_prefix
      FROM vendors
      WHERE to_tsvector('english', concat_ws(' ', vendor_name, code_prefix)) @@ websearch_to_tsquery('english', ?)
      ORDER BY ts_rank_cd(to_tsvector('english', concat_ws(' ', vendor_name, code_prefix)), websearch_to_tsquery('english', ?)) DESC
      LIMIT ?;
    `

    try {
      const result = await this.knex.raw(sql, [searchTerm, searchTerm, limit])
      return result.rows
    } catch (error) {
      logger.error('Error searching vendors:', error)
      return []
    }
  }
}

export const getOptions = (app: Application) => {
  return {
    id: 'id',
    paginate: app.get('paginate'),
  }
}
