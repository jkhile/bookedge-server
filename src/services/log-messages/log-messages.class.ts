import { KnexService } from '@feathersjs/knex'
// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type {
  LogMessage,
  LogMessageData,
  LogMessagePatch,
  LogMessageQuery,
} from './log-messages.schema'

export type { LogMessage, LogMessageData, LogMessagePatch, LogMessageQuery }

export interface LogMessageParams extends KnexAdapterParams<LogMessageQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class LogMessageService<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ServiceParams extends Params = LogMessageParams,
> extends KnexService<
  LogMessage,
  LogMessageData,
  LogMessageParams,
  LogMessagePatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'log-messages',
  }
}
