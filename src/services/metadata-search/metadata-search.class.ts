// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
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

    // Create a comma-separated list of fields to search
    const fieldList = fields.map((field) => `${field}`).join(', ')

    // Get user information for permission check
    const user = params?.user
    const isAdmin = user?.roles.includes('admin')
    const allowedImprints = user?.allowed_imprints

    // Build the imprints access control phrase
    const imprintsPhrase = isAdmin
      ? ''
      : `AND fk_imprint IN (${allowedImprints?.join(', ')})`

    // Build and execute the search query
    const sql = `
      SELECT id, title, ts_headline('english', concat_ws(' ', ${fieldList}), websearch_to_tsquery('english', ?),
        'ShortWord=0, MaxFragments=5, FragmentDelimiter="</br></br>"') AS headline
      FROM books
      WHERE to_tsvector('english', concat_ws(' ', ${fieldList})) @@ websearch_to_tsquery('english', ?)
      ${imprintsPhrase}
      ORDER BY ts_rank_cd(to_tsvector('english', concat_ws(' ', ${fieldList})), websearch_to_tsquery('english', ?)) DESC
      LIMIT 500;
    `

    try {
      const result = await this.knex.raw(sql, [
        searchTerm,
        searchTerm,
        searchTerm,
      ])
      return result.rows
    } catch (error: any) {
      console.error('Error searching metadata:', error.message)
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
