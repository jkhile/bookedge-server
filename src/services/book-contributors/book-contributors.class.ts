import { KnexService } from '@feathersjs/knex'
// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  BookContributor,
  BookContributorData,
  BookContributorPatch,
  BookContributorQuery,
} from './book-contributors.schema'

export type {
  BookContributor,
  BookContributorData,
  BookContributorPatch,
  BookContributorQuery,
}

export interface BookContributorParams
  extends KnexAdapterParams<BookContributorQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class BookContributorService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = BookContributorParams,
> extends KnexService<
  BookContributor,
  BookContributorData,
  BookContributorParams,
  BookContributorPatch
> {
  // Override createQuery to handle join parameters
  createQuery(params: KnexAdapterParams<BookContributorQuery>) {
    // Extract join parameters before calling parent
    const { $joinContributor, $joinBook, ...queryWithoutJoins } =
      params.query || {}

    // Create new params without join parameters
    const paramsForParent = {
      ...params,
      query: queryWithoutJoins,
    }

    // Call parent with cleaned params
    const query = super.createQuery(paramsForParent)

    // Handle $joinContributor
    if ($joinContributor) {
      query
        .leftJoin(
          'contributors',
          'book_contributors.fk_contributor',
          'contributors.id',
        )
        .select('book_contributors.*')
        .select(this.Model.raw('to_json(contributors.*) as contributor'))
    }

    // Handle $joinBook
    if ($joinBook) {
      query
        .leftJoin('books', 'book_contributors.fk_book', 'books.id')
        .select('book_contributors.*')
        .select(this.Model.raw('to_json(books.*) as book'))
    }

    return query
  }
}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'book_contributors',
  }
}
