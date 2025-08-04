// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import { logger } from '../../logger'
import type { Knex } from 'knex'
import type { Params, ServiceInterface } from '@feathersjs/feathers'
import type { Application } from '../../declarations'
import type {
  MetadataSearch,
  MetadataSearchResult,
} from './metadata-search.schema'

export type { MetadataSearch, MetadataSearchResult }

export interface MetadataSearchParams extends Params {
  // Using the User type already defined in the application
  query?: {
    searchTerm?: string
    fields?: string[]
    [key: string]: any
  }
}

// This is a custom service that doesn't extend KnexService directly since we don't
// need to persist data. It just implements the ServiceInterface
export class MetadataSearchService
  implements ServiceInterface<MetadataSearchResult[], MetadataSearch>
{
  app: Application
  knex: Knex

  constructor(app: Application) {
    this.app = app
    this.knex = app.get('postgresqlClient')
  }

  // Only implement 'find' to provide search functionality
  async find(params?: MetadataSearchParams): Promise<MetadataSearchResult[]> {
    // Check if required parameters are present
    if (!params?.query?.searchTerm || !params?.query?.fields) {
      throw new Error(
        'Missing required query parameters: searchTerm and fields',
      )
    }

    // Extract the search term and fields from the query
    const { searchTerm, fields } = params.query

    // Validate fields is an array
    if (!Array.isArray(fields)) {
      throw new Error('Fields must be an array of strings')
    }

    // Get user information for permission check
    const user = params?.user
    const isAdmin = user?.roles.includes('admin')
    const allowedImprints = user?.allowed_imprints

    // Build the imprints access control phrase
    const imprintsPhrase = isAdmin
      ? ''
      : `AND b.fk_imprint IN (${allowedImprints?.join(', ')})`

    // Separate fields into book fields and contributor fields
    const bookFields: string[] = []
    const contributorFields: string[] = []

    for (const field of fields) {
      if (field === 'author') {
        contributorFields.push('c.published_name')
      } else {
        bookFields.push(`b.${field}`)
      }
    }

    // Build the search fields list
    const allFields = [...bookFields, ...contributorFields]
    const fieldList = allFields.join(', ')

    // Build the query with proper joins for contributor data
    let sql: string
    if (contributorFields.length > 0) {
      // Include contributor data when searching for author
      // Use a subquery to handle DISTINCT properly with ORDER BY
      sql = `
        SELECT ranked_results.id, ranked_results.title, ranked_results.headline
        FROM (
          SELECT DISTINCT b.id, b.title, 
            ts_headline('english', concat_ws(' ', ${fieldList}), websearch_to_tsquery('english', ?),
              'ShortWord=0, MaxFragments=5, FragmentDelimiter="</br></br>"') AS headline,
            ts_rank_cd(to_tsvector('english', concat_ws(' ', ${fieldList})), websearch_to_tsquery('english', ?)) AS rank
          FROM books b
          LEFT JOIN book_contributors bc ON bc.fk_book = b.id
          LEFT JOIN contributors c ON c.id = bc.fk_contributor
          WHERE to_tsvector('english', concat_ws(' ', ${fieldList})) @@ websearch_to_tsquery('english', ?)
          ${imprintsPhrase}
        ) AS ranked_results
        ORDER BY ranked_results.rank DESC
        LIMIT 500;
      `
    } else {
      // Only search book fields when no author field is selected
      sql = `
        SELECT b.id, b.title, 
          ts_headline('english', concat_ws(' ', ${fieldList}), websearch_to_tsquery('english', ?),
            'ShortWord=0, MaxFragments=5, FragmentDelimiter="</br></br>"') AS headline
        FROM books b
        WHERE to_tsvector('english', concat_ws(' ', ${fieldList})) @@ websearch_to_tsquery('english', ?)
        ${imprintsPhrase}
        ORDER BY ts_rank_cd(to_tsvector('english', concat_ws(' ', ${fieldList})), websearch_to_tsquery('english', ?)) DESC
        LIMIT 500;
      `
    }

    try {
      // For the contributor query, we need 3 parameters: headline, rank, and where clause
      // For the book-only query, we need 3 parameters: headline, where clause, and order by
      const result = await this.knex.raw(sql, [
        searchTerm,
        searchTerm,
        searchTerm,
      ])
      return result.rows
    } catch (error: any) {
      logger.error('Error searching metadata:', error.message)
      throw error
    }
  }
}

export const getOptions = (app: Application) => {
  return {
    id: 'id',
    paginate: app.get('paginate'),
  }
}
