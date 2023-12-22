import { dataValidator, queryValidator } from '../../validators'
import {
  getValidator,
  querySyntax,
  StringEnum,
  Type,
} from '@feathersjs/typebox'
import { resolve } from '@feathersjs/schema'
// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import type { LogMessageService } from './log-messages.class'

// Main data model schema
export const logMessageSchema = Type.Object(
  {
    id: Type.Integer(),
    level: StringEnum(['debug', 'info', 'warn', 'error']),
    message: Type.String(),
  },
  { $id: 'LogMessages', additionalProperties: false },
)
export type LogMessage = Static<typeof logMessageSchema>
export const logMessageValidator = getValidator(logMessageSchema, dataValidator)
export const logMessageResolver = resolve<
  LogMessage,
  HookContext<LogMessageService>
>({})

export const logMessageExternalResolver = resolve<
  LogMessage,
  HookContext<LogMessageService>
>({})

// Schema for creating new entries
export const logMessageDataSchema = Type.Omit(logMessageSchema, ['id'], {
  $id: 'LogMessageData',
})
export type LogMessageData = Static<typeof logMessageDataSchema>
export const logMessageDataValidator = getValidator(
  logMessageDataSchema,
  dataValidator,
)
export const logMessageDataResolver = resolve<
  LogMessage,
  HookContext<LogMessageService>
>({})

// Schema for updating existing entries
export const logMessagePatchSchema = Type.Partial(logMessageSchema, {
  $id: 'LogMessagePatch',
})
export type LogMessagePatch = Static<typeof logMessagePatchSchema>
export const logMessagePatchValidator = getValidator(
  logMessagePatchSchema,
  dataValidator,
)
export const logMessagePatchResolver = resolve<
  LogMessage,
  HookContext<LogMessageService>
>({})

// Schema for allowed query properties
export const logMessageQueryProperties = Type.Omit(logMessageSchema, [])
export const logMessageQuerySchema = Type.Intersect(
  [
    querySyntax(logMessageQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type LogMessageQuery = Static<typeof logMessageQuerySchema>
export const logMessageQueryValidator = getValidator(
  logMessageQuerySchema,
  queryValidator,
)
export const logMessageQueryResolver = resolve<
  LogMessageQuery,
  HookContext<LogMessageService>
>({})
