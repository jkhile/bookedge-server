// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  Mentions,
  MentionsData,
  MentionsPatch,
  MentionsQuery,
} from './mentions.schema'

export type { Mentions, MentionsData, MentionsPatch, MentionsQuery }

export interface MentionsParams extends KnexAdapterParams<MentionsQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class MentionsService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = MentionsParams,
> extends KnexService<Mentions, MentionsData, MentionsParams, MentionsPatch> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'mentions',
  }
}
