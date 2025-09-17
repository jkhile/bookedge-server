import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { dataValidator, queryValidator } from '../../validators'

import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import type { FileDownloadsService } from './file-downloads.class'

// Main data model schema
export const fileDownloadsSchema = Type.Object(
  {
    id: Type.Integer(),
    file_storage_id: Type.Integer(),
    downloaded_by: Type.Integer(),
    downloaded_at: Type.String({ format: 'date-time' }),
    ip_address: Type.Optional(Type.String({ maxLength: 45 })),
    user_agent: Type.Optional(Type.String({ maxLength: 500 })),
    bytes_downloaded: Type.Optional(Type.Integer({ minimum: 0 })),
    completed: Type.Boolean({ default: true }),
    // Virtual fields for joined data
    file_name: Type.Optional(Type.String()),
    downloaded_by_name: Type.Optional(Type.String()),
    downloaded_by_email: Type.Optional(Type.String()),
  },
  { $id: 'FileDownloads', additionalProperties: false },
)

export type FileDownloads = Static<typeof fileDownloadsSchema>
export const fileDownloadsValidator = getValidator(
  fileDownloadsSchema,
  dataValidator,
)
export const fileDownloadsResolver = resolve<
  FileDownloads,
  HookContext<FileDownloadsService>
>({})

export const fileDownloadsExternalResolver = resolve<
  FileDownloads,
  HookContext<FileDownloadsService>
>({})

// Schema for creating new entries
export const fileDownloadsDataSchema = Type.Pick(
  fileDownloadsSchema,
  [
    'file_storage_id',
    'downloaded_by',
    'ip_address',
    'user_agent',
    'bytes_downloaded',
    'completed',
  ],
  { $id: 'FileDownloadsData' },
)

export type FileDownloadsData = Static<typeof fileDownloadsDataSchema>
export const fileDownloadsDataValidator = getValidator(
  fileDownloadsDataSchema,
  dataValidator,
)
export const fileDownloadsDataResolver = resolve<
  FileDownloads,
  HookContext<FileDownloadsService>
>({
  downloaded_at: async () => new Date().toISOString(),
})

// Schema for updating existing entries
export const fileDownloadsPatchSchema = Type.Partial(
  Type.Pick(fileDownloadsSchema, ['bytes_downloaded', 'completed']),
  { $id: 'FileDownloadsPatch' },
)

export type FileDownloadsPatch = Static<typeof fileDownloadsPatchSchema>
export const fileDownloadsPatchValidator = getValidator(
  fileDownloadsPatchSchema,
  dataValidator,
)
export const fileDownloadsPatchResolver = resolve<
  FileDownloads,
  HookContext<FileDownloadsService>
>({})

// Schema for allowed query properties
export const fileDownloadsQueryProperties = Type.Pick(fileDownloadsSchema, [
  'id',
  'file_storage_id',
  'downloaded_by',
  'downloaded_at',
  'completed',
])

export const fileDownloadsQuerySchema = Type.Intersect(
  [
    querySyntax(fileDownloadsQueryProperties),
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)

export type FileDownloadsQuery = Static<typeof fileDownloadsQuerySchema>
export const fileDownloadsQueryValidator = getValidator(
  fileDownloadsQuerySchema,
  queryValidator,
)
export const fileDownloadsQueryResolver = resolve<
  FileDownloadsQuery,
  HookContext<FileDownloadsService>
>({})
