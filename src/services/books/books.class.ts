import { KnexService } from '@feathersjs/knex'
// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  Book,
  BookData,
  BookPatch,
  BookQuery,
  BookSearchQuery,
} from './books.schema'

export type { Book, BookData, BookPatch, BookQuery, BookSearchQuery }

export interface BookParams extends KnexAdapterParams<BookQuery> {}

export interface SearchData {
  fields: string[]
  searchTerm: string
}

export interface SearchResults {
  id: number
  title: string
  headline: string
}
;[]

export class BookService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = BookParams,
> extends KnexService<Book, BookData, BookParams, BookPatch> {
  async search(data: SearchData, params?: Params): Promise<SearchResults> {
    const { searchTerm, fields } = data
    const knex = this.Model
    const fieldList = fields.map((field) => `${field}`).join(', ')
    const user = params?.user
    const allowedImprints = user?.allowed_imprints || []
    let searchResults = [] as unknown as SearchResults
    const sql = `
      SELECT id, title, ts_headline('english', concat_ws(' ', ${fieldList}), websearch_to_tsquery('english', ?),
        'ShortWord=0, MaxFragments=5, FragmentDelimiter="</br></br>"') AS headline
      FROM books
      WHERE to_tsvector('english', concat_ws(' ', ${fieldList})) @@ websearch_to_tsquery('english', ?)
      AND fk_imprint IN (${allowedImprints.join(', ')})
      ORDER BY ts_rank_cd(to_tsvector('english', concat_ws(' ', ${fieldList})), websearch_to_tsquery('english', ?)) DESC
      LIMIT 500;
      `
    try {
      const result = await knex.raw(sql, [searchTerm, searchTerm, searchTerm])
      searchResults = result.rows
    } catch (error: any) {
      console.error('Error searching metadata:', error.message)
      throw error
    }
    return searchResults
  }
}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'books',
  }
}
