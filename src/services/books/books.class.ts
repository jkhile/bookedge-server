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

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class BookService<
  ServiceParams extends Params = BookParams,
> extends KnexService<Book, BookData, BookParams, BookPatch> {
  async search(
    params: ServiceParams & { query: BookSearchQuery },
  ): Promise<string[]> {
    const { fields, query: searchQuery } = params.query
    console.log('searchQuery:', searchQuery)
    console.log('params:', params)
    const knex = this.Model
    const fieldList = fields.map((field) => `${field}`).join(', ')
    let searchResults: string[] = []
    const sql = `
      SELECT id, title, ts_headline('english', concat_ws(' ', ${fieldList}), websearch_to_tsquery('english', ?),
        'ShortWord=0, MaxFragments=5, FragmentDelimiter="</br></br>"') AS headline
      FROM books
      WHERE to_tsvector('english', concat_ws(' ', ${fieldList})) @@ websearch_to_tsquery('english', ?)
      ORDER BY ts_rank_cd(to_tsvector('english', concat_ws(' ', ${fieldList})), websearch_to_tsquery('english', ?)) DESC
      LIMIT 500;
      `
    try {
      const result = await knex.raw(sql, [
        searchQuery,
        searchQuery,
        searchQuery,
      ])
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
