// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  BookContributorRoles,
  BookContributorRolesData,
  BookContributorRolesPatch,
  BookContributorRolesQuery,
} from './book-contributor-roles.schema'

export type {
  BookContributorRoles,
  BookContributorRolesData,
  BookContributorRolesPatch,
  BookContributorRolesQuery,
}

export interface BookContributorRolesParams
  extends KnexAdapterParams<BookContributorRolesQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class BookContributorRolesService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = BookContributorRolesParams,
> extends KnexService<
  BookContributorRoles,
  BookContributorRolesData,
  BookContributorRolesParams,
  BookContributorRolesPatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'book-contributor-roles',
  }
}
