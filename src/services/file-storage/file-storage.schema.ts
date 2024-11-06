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
    id: Type.Number(),
    text: Type.String(),
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
export const fileStorageDataSchema = Type.Pick(fileStorageSchema, ['text'], {
  $id: 'FileStorageData',
})
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
  'text',
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
