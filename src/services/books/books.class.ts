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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = BookParams,
> extends KnexService<Book, BookData, BookParams, BookPatch> {
  async search(
    params: ServiceParams & { query: BookSearchQuery },
  ): Promise<string[]> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fields, query: searchquery } = params.query
    const db = this.Model
    const fieldList = fields.map((field) => `${field}`).join(" || ' ' || ")
    console.log('fieldList:', fieldList)

    const tResult = await db.raw(
      `SELECT id, title, ts_headline('english', ${fieldList}, websearch_to_tsquery('${searchquery}')) AS headline
      FROM books
      WHERE to_tsvector('english', ${fieldList}) @@ websearch_to_tsquery('${searchquery}')
      ORDER BY ts_rank_cd(to_tsvector('english', ${fieldList}), websearch_to_tsquery('${searchquery}'))
      LIMIT 10
      `,
    )
    console.log('tResult.rows:', tResult.rows)

    return ['some', 'result.rows']
  }
}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'books',
  }
}

// export class BookService<
//   ServiceParams extends Params = BookParams,
// > extends KnexService<Book, BookData, BookParams, BookPatch> {
//   async search(
//     params: ServiceParams & { query: BookSearchQuery },
//   ): Promise<string[]> {
//     const { fields, query } = params.query
//     const knex = this.getModel(params)

//     const result = await knex.raw(
//       `
//       SELECT ts_headline(
//         'english',
//         string_agg(concat_ws(' ', ${fields.map((field) => `"${field}"`).join(', ')}), ' '),
//         websearch_to_tsquery('english', ?),
//         'StartSel=<mark>, StopSel=</mark>, MaxFragments=1, MaxWords=10, MinWords=5'
//       ) AS headline
//       FROM books
//       WHERE to_tsvector('english', concat_ws(' ', ${fields.map((field) => `"${field}"`).join(', ')})) @@ websearch_to_tsquery('english', ?)
//       GROUP BY id
//       ORDER BY ts_rank_cd(to_tsvector('english', concat_ws(' ', ${fields.map((field) => `"${field}"`).join(', ')})), websearch_to_tsquery('english', ?)) DESC
//       LIMIT 10
//     `,
//       [query, query, query],
//     )

//     return result.rows.map((row: { headline: string }) => row.headline)
//   }
// }
