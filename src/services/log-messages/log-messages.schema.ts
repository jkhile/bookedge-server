import { dataValidator } from '../../validators'
import { getValidator, StringEnum, Type } from '@feathersjs/typebox'
import { resolve } from '@feathersjs/schema'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import type { LogMessageService } from './log-messages.class'

// Schema for creating log entries
export const logMessageDataSchema = Type.Object(
  {
    level: StringEnum(['debug', 'info', 'warn', 'error']),
    message: Type.String({ maxLength: 10000 }), // Prevent extremely large messages
    source: Type.Optional(StringEnum(['client', 'server'])),
    metadata: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    timestamp: Type.Optional(Type.String({ format: 'date-time' })), // Client timestamp
  },
  { $id: 'LogMessageData', additionalProperties: false },
)

export type LogMessageData = Static<typeof logMessageDataSchema>

export const logMessageDataValidator = getValidator(
  logMessageDataSchema,
  dataValidator,
)

export const logMessageDataResolver = resolve<
  LogMessageData,
  HookContext<LogMessageService>
>({
  source: async (value) => value || 'client', // Default to client source
})
