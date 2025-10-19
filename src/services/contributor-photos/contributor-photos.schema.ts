// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import { dataValidator, queryValidator } from '../../validators'
import type { HookContext } from '../../declarations'

// Main data model schema
export const contributorPhotosSchema = Type.Object(
  {
    id: Type.Number(),
    contributor_id: Type.Number(),

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
  { $id: 'ContributorPhotos', additionalProperties: false },
)
export type ContributorPhotos = Static<typeof contributorPhotosSchema>
export const contributorPhotosValidator = getValidator(
  contributorPhotosSchema,
  dataValidator,
)
export const contributorPhotosResolver = resolve<
  ContributorPhotos,
  HookContext
>({})

export const contributorPhotosExternalResolver = resolve<
  ContributorPhotos,
  HookContext
>({})

// Schema for creating new entries
export const contributorPhotosDataSchema = Type.Pick(
  contributorPhotosSchema,
  [
    'contributor_id',
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
  { $id: 'ContributorPhotosData' },
)
export type ContributorPhotosData = Static<typeof contributorPhotosDataSchema>
export const contributorPhotosDataValidator = getValidator(
  contributorPhotosDataSchema,
  dataValidator,
)
export const contributorPhotosDataResolver = resolve<
  ContributorPhotos,
  HookContext
>({})

// Schema for updating existing entries
export const contributorPhotosPatchSchema = Type.Partial(
  Type.Pick(contributorPhotosSchema, ['display_order', 'comments']),
  { $id: 'ContributorPhotosPatch' },
)
export type ContributorPhotosPatch = Static<typeof contributorPhotosPatchSchema>
export const contributorPhotosPatchValidator = getValidator(
  contributorPhotosPatchSchema,
  dataValidator,
)
export const contributorPhotosPatchResolver = resolve<
  ContributorPhotos,
  HookContext
>({})

// Schema for allowed query properties
export const contributorPhotosQueryProperties = Type.Pick(
  contributorPhotosSchema,
  ['id', 'contributor_id', 'drive_file_id', 'display_order'],
)
export const contributorPhotosQuerySchema = Type.Intersect(
  [
    querySyntax(contributorPhotosQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type ContributorPhotosQuery = Static<typeof contributorPhotosQuerySchema>
export const contributorPhotosQueryValidator = getValidator(
  contributorPhotosQuerySchema,
  queryValidator,
)
export const contributorPhotosQueryResolver = resolve<
  ContributorPhotosQuery,
  HookContext
>({})
