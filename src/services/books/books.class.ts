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

export class BookService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = BookParams,
> extends KnexService<Book, BookData, BookParams, BookPatch> {
  // Override createQuery to add subqueries for virtual properties
  createQuery(params: KnexAdapterParams<BookQuery>) {
    const query = super.createQuery(params)

    // Subquery to get the author name from contributors table via book-contributor-roles
    // Using raw SQL for better control over quoting with hyphenated table names
    const authorSubquery = `
      SELECT contributors.published_name 
      FROM contributors 
      INNER JOIN "book-contributor-roles" ON contributors.id = "book-contributor-roles".fk_contributor 
      WHERE "book-contributor-roles".fk_book = books.id 
      ORDER BY CASE WHEN "book-contributor-roles".contributor_role = 'Author' THEN 0 ELSE 1 END 
      LIMIT 1
    `

    // Add the author as a field via subquery
    query.select(this.Model.raw(`(${authorSubquery}) as author`))

    // Subquery to get the earliest publication date from releases table
    // Only considering non-empty publication dates
    const publishedDateSubquery = this.Model.select('publication_date')
      .from('releases')
      .whereRaw('releases.fk_book = books.id')
      .whereRaw("releases.publication_date != ''")
      .orderBy('publication_date', 'asc')
      .limit(1)

    // Add the published_date as a field via subquery
    // Use COALESCE to default to empty string if no releases are found
    query.select(
      this.Model.raw(
        `COALESCE((${publishedDateSubquery.toQuery()}), '') as published_date`,
      ),
    )

    // Subquery to count unresolved issues for the book
    const issuesCountSubquery = this.Model.count('* as count')
      .from('issues')
      .whereRaw('issues.fk_book = books.id')
      .where('resolved', false)

    // Add the issues_count as a field via subquery
    // Use COALESCE to default to 0 if there are no issues
    query.select(
      this.Model.raw(
        `COALESCE((${issuesCountSubquery.toQuery()}), 0) as issues_count`,
      ),
    )

    return query
  }

  // Search method has been moved to the metadata-search service
}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'books',
  }
}
