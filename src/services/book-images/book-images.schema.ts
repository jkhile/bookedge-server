// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import { dataValidator, queryValidator } from '../../validators'
import type { HookContext } from '../../declarations'

// Main data model schema
export const bookImagesSchema = Type.Object(
  {
    id: Type.Number(),
    book_id: Type.Number(),
    purpose: Type.String({ maxLength: 50 }), // 'cover' or 'contributor'

    // Google Drive file information
    drive_file_id: Type.String({ maxLength: 255 }),
    drive_url: Type.String(),
    thumbnail_url: Type.Optional(Type.String()),
    thumbnail_data: Type.Optional(Type.String()), // Base64 encoded thumbnail
    original_filename: Type.String({ maxLength: 255 }),
    file_size_bytes: Type.Optional(Type.Number()),
    mime_type: Type.Optional(Type.String({ maxLength: 100 })),
    width: Type.Optional(Type.Number()),
    height: Type.Optional(Type.Number()),

    // Metadata
    uploaded_by: Type.Optional(Type.Number()),
    uploaded_at: Type.Optional(Type.String({ format: 'date-time' })),
    display_order: Type.Optional(Type.Number()),
    comments: Type.Optional(Type.String()),

    // System fields
    created_at: Type.Optional(Type.String({ format: 'date-time' })),
    updated_at: Type.Optional(Type.String({ format: 'date-time' })),
  },
  { $id: 'BookImages', additionalProperties: false },
)
export type BookImages = Static<typeof bookImagesSchema>
export const bookImagesValidator = getValidator(bookImagesSchema, dataValidator)
export const bookImagesResolver = resolve<BookImages, HookContext>({})

export const bookImagesExternalResolver = resolve<BookImages, HookContext>({})

// Schema for creating new entries
export const bookImagesDataSchema = Type.Pick(
  bookImagesSchema,
  [
    'book_id',
    'purpose',
    'drive_file_id',
    'drive_url',
    'thumbnail_url',
    'thumbnail_data',
    'original_filename',
    'file_size_bytes',
    'mime_type',
    'width',
    'height',
    'uploaded_by',
    'display_order',
    'comments',
  ],
  { $id: 'BookImagesData' },
)
export type BookImagesData = Static<typeof bookImagesDataSchema>
export const bookImagesDataValidator = getValidator(
  bookImagesDataSchema,
  dataValidator,
)
export const bookImagesDataResolver = resolve<BookImages, HookContext>({})

// Schema for updating existing entries
export const bookImagesPatchSchema = Type.Partial(
  Type.Pick(bookImagesSchema, ['display_order', 'comments']),
  { $id: 'BookImagesPatch' },
)
export type BookImagesPatch = Static<typeof bookImagesPatchSchema>
export const bookImagesPatchValidator = getValidator(
  bookImagesPatchSchema,
  dataValidator,
)
export const bookImagesPatchResolver = resolve<BookImages, HookContext>({})

// Schema for allowed query properties
export const bookImagesQueryProperties = Type.Pick(bookImagesSchema, [
  'id',
  'book_id',
  'purpose',
  'drive_file_id',
  'display_order',
])
export const bookImagesQuerySchema = Type.Intersect(
  [
    querySyntax(bookImagesQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type BookImagesQuery = Static<typeof bookImagesQuerySchema>
export const bookImagesQueryValidator = getValidator(
  bookImagesQuerySchema,
  queryValidator,
)
export const bookImagesQueryResolver = resolve<BookImagesQuery, HookContext>({})
