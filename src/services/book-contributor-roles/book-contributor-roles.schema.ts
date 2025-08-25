// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { BookContributorRolesService } from './book-contributor-roles.class'

// Main data model schema
export const bookContributorRolesSchema = Type.Object(
  {
    id: Type.Integer(),
    fk_book: Type.Integer(),
    fk_contributor: Type.Integer(),
    contributor_role: Type.String({ default: '' }),
    fk_created_by: Type.Optional(Type.Integer()),
    created_at: Type.Optional(Type.String()),
    fk_updated_by: Type.Optional(Type.Integer()),
    updated_at: Type.Optional(Type.String()),
  },
  { $id: 'BookContributorRoles', additionalProperties: false },
)
export type BookContributorRoles = Static<typeof bookContributorRolesSchema>
export const bookContributorRolesValidator = getValidator(
  bookContributorRolesSchema,
  dataValidator,
)
export const bookContributorRolesResolver = resolve<
  BookContributorRoles,
  HookContext<BookContributorRolesService>
>({})

export const bookContributorRolesExternalResolver = resolve<
  BookContributorRoles,
  HookContext<BookContributorRolesService>
>({})

// Schema for creating new entries
export const bookContributorRolesDataSchema = Type.Omit(
  bookContributorRolesSchema,
  ['id', 'fk_created_by', 'created_at', 'fk_updated_by', 'updated_at'],
  {
    $id: 'BookContributorRolesData',
  },
)
export type BookContributorRolesData = Static<
  typeof bookContributorRolesDataSchema
>
export const bookContributorRolesDataValidator = getValidator(
  bookContributorRolesDataSchema,
  dataValidator,
)
export const bookContributorRolesDataResolver = resolve<
  BookContributorRoles,
  HookContext<BookContributorRolesService>
>({})

// Schema for updating existing entries
export const bookContributorRolesPatchSchema = Type.Partial(
  bookContributorRolesSchema,
  {
    $id: 'BookContributorRolesPatch',
  },
)
export type BookContributorRolesPatch = Static<
  typeof bookContributorRolesPatchSchema
>
export const bookContributorRolesPatchValidator = getValidator(
  bookContributorRolesPatchSchema,
  dataValidator,
)
export const bookContributorRolesPatchResolver = resolve<
  BookContributorRoles,
  HookContext<BookContributorRolesService>
>({})

// Schema for allowed query properties
export const bookContributorRolesQueryProperties = Type.Omit(
  bookContributorRolesSchema,
  [],
)
export const bookContributorRolesQuerySchema = Type.Intersect(
  [
    querySyntax(bookContributorRolesQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type BookContributorRolesQuery = Static<
  typeof bookContributorRolesQuerySchema
>
export const bookContributorRolesQueryValidator = getValidator(
  bookContributorRolesQuerySchema,
  queryValidator,
)
export const bookContributorRolesQueryResolver = resolve<
  BookContributorRolesQuery,
  HookContext<BookContributorRolesService>
>({})
