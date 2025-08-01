import { dataValidator, queryValidator } from '../../validators'
import { getValidator, querySyntax, Type } from '@feathersjs/typebox'
import { resolve } from '@feathersjs/schema'
import {
  createDataResolver,
  createUpdateResolver,
} from '../../utils/update-resolver'
// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import type { BookContributorService } from './book-contributors.class'

// Main data model schema
export const bookContributorSchema = Type.Object(
  {
    id: Type.Integer(),
    fk_book: Type.Integer(),
    fk_contributor: Type.Integer(),
    contributor_role: Type.String(),
    display_order: Type.Integer({ default: 0 }),
    fk_created_by: Type.Optional(Type.Integer()),
    created_at: Type.Optional(Type.String({ format: 'date-time' })),
    fk_updated_by: Type.Optional(Type.Integer()),
    updated_at: Type.Optional(Type.String({ format: 'date-time' })),
    // Virtual fields for joined data
    contributor: Type.Optional(Type.Any()), // Will be populated via join
    book: Type.Optional(Type.Any()), // Will be populated via join
  },
  { $id: 'BookContributor', additionalProperties: false },
)
export type BookContributor = Static<typeof bookContributorSchema>
export const bookContributorValidator = getValidator(
  bookContributorSchema,
  dataValidator,
)
export const bookContributorResolver = resolve<
  BookContributor,
  HookContext<BookContributorService>
>({})

export const bookContributorExternalResolver = resolve<
  BookContributor,
  HookContext<BookContributorService>
>({})

// Schema for creating new entries
export const bookContributorDataSchema = Type.Omit(
  bookContributorSchema,
  [
    'id',
    'fk_created_by',
    'created_at',
    'fk_updated_by',
    'updated_at',
    'contributor',
    'book',
  ],
  {
    $id: 'BookContributorData',
  },
)
export type BookContributorData = Static<typeof bookContributorDataSchema>
export const bookContributorDataValidator = getValidator(
  bookContributorDataSchema,
  dataValidator,
)
export const bookContributorDataResolver = resolve<
  BookContributor,
  HookContext<BookContributorService>
>(createDataResolver<BookContributor>())

// Schema for updating existing entries
export const bookContributorPatchSchema = Type.Partial(bookContributorSchema, {
  $id: 'BookContributorPatch',
})
export type BookContributorPatch = Static<typeof bookContributorPatchSchema>
export const bookContributorPatchValidator = getValidator(
  bookContributorPatchSchema,
  dataValidator,
)
export const bookContributorPatchResolver = resolve<
  BookContributor,
  HookContext<BookContributorService>
>(createUpdateResolver<BookContributor>())

// Schema for allowed query properties
export const bookContributorQueryProperties = Type.Omit(bookContributorSchema, [
  'contributor',
  'book',
])
export const bookContributorQuerySchema = Type.Intersect(
  [
    querySyntax(bookContributorQueryProperties),
    // Add additional query properties here
    Type.Object(
      {
        // Allow joining with contributor and book data
        $joinContributor: Type.Optional(Type.Boolean()),
        $joinBook: Type.Optional(Type.Boolean()),
      },
      { additionalProperties: false },
    ),
  ],
  { additionalProperties: false },
)
export type BookContributorQuery = Static<typeof bookContributorQuerySchema>
export const bookContributorQueryValidator = getValidator(
  bookContributorQuerySchema,
  queryValidator,
)
export const bookContributorQueryResolver = resolve<
  BookContributorQuery,
  HookContext<BookContributorService>
>({})
