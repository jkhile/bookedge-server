// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'
import type { Application } from '../../declarations'
import type { Issue, IssueData, IssuePatch, IssueQuery } from './issues.schema'

export type { Issue, IssueData, IssuePatch, IssueQuery }

export interface IssueParams extends KnexAdapterParams<IssueQuery> {}

// Customized service to include book_title via a join
export class IssueService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = IssueParams,
> extends KnexService<Issue, IssueData, IssueParams, IssuePatch> {
  // Override createQuery to join with books table
  createQuery(params: KnexAdapterParams<IssueQuery>) {
    const query = super.createQuery(params)

    // Join with books table to get book_title
    query
      .leftJoin('books', 'issues.fk_book', 'books.id')
      .select('books.title as book_title')

    return query
  }
}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'issues',
  }
}
