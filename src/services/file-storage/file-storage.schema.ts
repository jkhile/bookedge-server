// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { FileStorageService } from './file-storage.class'

// Main data model schema
export const fileStorageSchema = Type.Object(
  {
    id: Type.String(),
    name: Type.String(),
    mimeType: Type.String(),
    size: Type.Number(),
    fkUploadedBy: Type.Integer(),
    uploadedAt: Type.String(),
    chunks: Type.Optional(Type.Number()),
    status: Type.Union([
      Type.Literal('uploading'),
      Type.Literal('complete'),
      Type.Literal('error'),
    ]),
  },
  { $id: 'FileStorage', additionalProperties: false },
)
export type FileStorage = Static<typeof fileStorageSchema>
export const fileStorageValidator = getValidator(
  fileStorageSchema,
  dataValidator,
)
export const fileStorageResolver = resolve<
  FileStorage,
  HookContext<FileStorageService>
>({})

export const fileStorageExternalResolver = resolve<
  FileStorage,
  HookContext<FileStorageService>
>({})

// Schema for creating new entries
export const fileStorageDataSchema = Type.Pick(
  fileStorageSchema,
  ['name', 'mimeType', 'size', 'fkUploadedBy'],
  {
    $id: 'FileStorageData',
  },
)
export type FileStorageData = Static<typeof fileStorageDataSchema>
export const fileStorageDataValidator = getValidator(
  fileStorageDataSchema,
  dataValidator,
)
export const fileStorageDataResolver = resolve<
  FileStorage,
  HookContext<FileStorageService>
>({})

// Schema for updating existing entries
export const fileStoragePatchSchema = Type.Partial(fileStorageSchema, {
  $id: 'FileStoragePatch',
})
export type FileStoragePatch = Static<typeof fileStoragePatchSchema>
export const fileStoragePatchValidator = getValidator(
  fileStoragePatchSchema,
  dataValidator,
)
export const fileStoragePatchResolver = resolve<
  FileStorage,
  HookContext<FileStorageService>
>({})

// Schema for allowed query properties
export const fileStorageQueryProperties = Type.Pick(fileStorageSchema, [
  'id',
  'name',
  'mimeType',
  'fkUploadedBy',
  'uploadedAt',
  'status',
])
export const fileStorageQuerySchema = Type.Intersect(
  [
    querySyntax(fileStorageQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type FileStorageQuery = Static<typeof fileStorageQuerySchema>
export const fileStorageQueryValidator = getValidator(
  fileStorageQuerySchema,
  queryValidator,
)
export const fileStorageQueryResolver = resolve<
  FileStorageQuery,
  HookContext<FileStorageService>
>({})
