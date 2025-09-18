import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { dataValidator, queryValidator } from '../../validators'
import { formatISO } from 'date-fns'

import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import type { FileStorageService } from './file-storage.class'

// Main data model schema
export const fileStorageSchema = Type.Object(
  {
    id: Type.Integer(),
    book_id: Type.Integer(),
    drive_id: Type.String({ minLength: 1, maxLength: 255 }),
    drive_folder_id: Type.Optional(Type.String({ maxLength: 255 })),
    file_name: Type.String({ minLength: 1, maxLength: 500 }),
    file_path: Type.String({ minLength: 1, maxLength: 1000 }),
    original_name: Type.String({ minLength: 1, maxLength: 500 }),
    file_size: Type.Integer({ minimum: 0 }),
    file_type: Type.String({ minLength: 1, maxLength: 255 }),
    file_extension: Type.Optional(Type.String({ maxLength: 50 })),
    purpose: Type.Optional(Type.String({ maxLength: 255 })),
    description: Type.Optional(Type.String({ maxLength: 1000 })),
    finalized: Type.Boolean({ default: false }),
    metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
    uploaded_by: Type.Integer(),
    uploaded_at: Type.String({ format: 'date-time' }),
    updated_by: Type.Optional(Type.Integer()),
    updated_at: Type.String({ format: 'date-time' }),
    // Virtual fields for joined data
    book_title: Type.Optional(Type.String()),
    uploaded_by_name: Type.Optional(Type.String()),
    updated_by_name: Type.Optional(Type.String()),
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
  [
    'book_id',
    'drive_id',
    'drive_folder_id',
    'file_name',
    'file_path',
    'original_name',
    'file_size',
    'file_type',
    'file_extension',
    'purpose',
    'description',
    'finalized',
    'metadata',
  ],
  { $id: 'FileStorageData' },
)

export type FileStorageData = Static<typeof fileStorageDataSchema>
export const fileStorageDataValidator = getValidator(
  fileStorageDataSchema,
  dataValidator,
)
export const fileStorageDataResolver = resolve<
  FileStorage,
  HookContext<FileStorageService>
>({
  uploaded_at: async () => formatISO(new Date()),
  uploaded_by: async (value, data, context) => context.params.user?.id || 0,
  updated_at: async () => formatISO(new Date()),
  updated_by: async (value, data, context) => context.params.user?.id || 0,
})

// Schema for updating existing entries
export const fileStoragePatchSchema = Type.Partial(
  Type.Pick(fileStorageSchema, [
    'file_name',
    'purpose',
    'description',
    'finalized',
    'metadata',
  ]),
  { $id: 'FileStoragePatch' },
)

export type FileStoragePatch = Static<typeof fileStoragePatchSchema>
export const fileStoragePatchValidator = getValidator(
  fileStoragePatchSchema,
  dataValidator,
)
export const fileStoragePatchResolver = resolve<
  FileStorage,
  HookContext<FileStorageService>
>({
  updated_at: async () => formatISO(new Date()),
  updated_by: async (value, data, context) => context.params.user?.id || 0,
})

// Schema for allowed query properties
export const fileStorageQueryProperties = Type.Pick(fileStorageSchema, [
  'id',
  'book_id',
  'drive_id',
  'drive_folder_id',
  'file_name',
  'file_path',
  'original_name',
  'file_type',
  'file_extension',
  'purpose',
  'finalized',
  'uploaded_by',
  'uploaded_at',
  'updated_by',
  'updated_at',
])

export const fileStorageQuerySchema = Type.Intersect(
  [
    querySyntax(fileStorageQueryProperties),
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

// Special schema for file upload
export const fileUploadSchema = Type.Object(
  {
    book_id: Type.Integer(),
    purpose: Type.String({ minLength: 1, maxLength: 255 }),
    description: Type.Optional(Type.String({ maxLength: 1000 })),
    finalized: Type.Optional(Type.Boolean({ default: false })),
    metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
  },
  { $id: 'FileUpload', additionalProperties: false },
)

export type FileUpload = Static<typeof fileUploadSchema>
export const fileUploadValidator = getValidator(fileUploadSchema, dataValidator)
