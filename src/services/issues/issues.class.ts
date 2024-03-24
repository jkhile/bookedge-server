// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type { Issue, IssueData, IssuePatch, IssueQuery } from './issues.schema'

export type { Issue, IssueData, IssuePatch, IssueQuery }

export interface IssueParams extends KnexAdapterParams<IssueQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class IssueService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = IssueParams,
> extends KnexService<Issue, IssueData, IssueParams, IssuePatch> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'issues',
  }
}
