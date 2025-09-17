import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { dataValidator, queryValidator } from '../../validators'

import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import type { FileAccessLogsService } from './file-access-logs.class'

// Main data model schema
export const fileAccessLogsSchema = Type.Object(
  {
    id: Type.Integer(),
    file_storage_id: Type.Integer(),
    action: Type.Union([
      Type.Literal('view'),
      Type.Literal('download'),
      Type.Literal('upload'),
      Type.Literal('update'),
      Type.Literal('delete'),
      Type.Literal('move'),
      Type.Literal('rename'),
      Type.Literal('share'),
    ]),
    user_id: Type.Integer(),
    performed_at: Type.String({ format: 'date-time' }),
    details: Type.Optional(Type.Object({}, { additionalProperties: true })),
    // Virtual fields
    file_name: Type.Optional(Type.String()),
    user_name: Type.Optional(Type.String()),
  },
  { $id: 'FileAccessLogs', additionalProperties: false },
)

export type FileAccessLogs = Static<typeof fileAccessLogsSchema>
export const fileAccessLogsValidator = getValidator(
  fileAccessLogsSchema,
  dataValidator,
)
export const fileAccessLogsResolver = resolve<
  FileAccessLogs,
  HookContext<FileAccessLogsService>
>({})

export const fileAccessLogsExternalResolver = resolve<
  FileAccessLogs,
  HookContext<FileAccessLogsService>
>({})

// Schema for creating new entries
export const fileAccessLogsDataSchema = Type.Pick(
  fileAccessLogsSchema,
  ['file_storage_id', 'action', 'user_id', 'details'],
  { $id: 'FileAccessLogsData' },
)

export type FileAccessLogsData = Static<typeof fileAccessLogsDataSchema>
export const fileAccessLogsDataValidator = getValidator(
  fileAccessLogsDataSchema,
  dataValidator,
)
export const fileAccessLogsDataResolver = resolve<
  FileAccessLogs,
  HookContext<FileAccessLogsService>
>({
  performed_at: async () => new Date().toISOString(),
})

// Schema for allowed query properties
export const fileAccessLogsQueryProperties = Type.Pick(fileAccessLogsSchema, [
  'id',
  'file_storage_id',
  'action',
  'user_id',
  'performed_at',
])

export const fileAccessLogsQuerySchema = Type.Intersect(
  [
    querySyntax(fileAccessLogsQueryProperties),
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)

export type FileAccessLogsQuery = Static<typeof fileAccessLogsQuerySchema>
export const fileAccessLogsQueryValidator = getValidator(
  fileAccessLogsQuerySchema,
  queryValidator,
)
export const fileAccessLogsQueryResolver = resolve<
  FileAccessLogsQuery,
  HookContext<FileAccessLogsService>
>({})
