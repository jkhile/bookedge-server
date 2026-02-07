import { dataValidator, queryValidator } from '../../validators'
import { getValidator, querySyntax, Type } from '@feathersjs/typebox'
import { resolve } from '@feathersjs/schema'
import {
  createDataResolver,
  createUpdateResolver,
} from '../../utils/update-resolver'
// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import type { ContributorService } from './contributors.class'

// Main data model schema
export const contributorSchema = Type.Object(
  {
    id: Type.Integer(),
    legal_name: Type.String(),
    published_name: Type.String(),
    biography: Type.String(),
    biography_finalized: Type.Boolean(),
    email: Type.String(),
    public_email: Type.String({ default: '' }),
    address: Type.String(),
    phone: Type.String(),
    wikipedia_page: Type.String(),
    amazon_author_page: Type.String(),
    notes: Type.String(),
    fk_created_by: Type.Optional(Type.Integer()),
    created_at: Type.Optional(Type.String({ format: 'date-time' })),
    fk_updated_by: Type.Optional(Type.Integer()),
    updated_at: Type.Optional(Type.String({ format: 'date-time' })),
  },
  { $id: 'Contributor', additionalProperties: false },
)
export type Contributor = Static<typeof contributorSchema>
export const contributorValidator = getValidator(
  contributorSchema,
  dataValidator,
)
export const contributorResolver = resolve<
  Contributor,
  HookContext<ContributorService>
>({})

export const contributorExternalResolver = resolve<
  Contributor,
  HookContext<ContributorService>
>({})

// Schema for creating new entries
export const contributorDataSchema = Type.Omit(
  contributorSchema,
  ['id', 'fk_created_by', 'created_at', 'fk_updated_by', 'updated_at'],
  {
    $id: 'ContributorData',
  },
)
export type ContributorData = Static<typeof contributorDataSchema>
export const contributorDataValidator = getValidator(
  contributorDataSchema,
  dataValidator,
)
export const contributorDataResolver = resolve<
  Contributor,
  HookContext<ContributorService>
>({
  ...createDataResolver<Contributor>(),
  // Sanitize published_name by removing trailing commas and whitespace
  published_name: async (value: string | undefined) => {
    if (typeof value === 'string') {
      return value.replace(/[,\s]+$/, '').trim()
    }
    return value
  },
})

// Schema for updating existing entries
export const contributorPatchSchema = Type.Partial(contributorSchema, {
  $id: 'ContributorPatch',
})
export type ContributorPatch = Static<typeof contributorPatchSchema>
export const contributorPatchValidator = getValidator(
  contributorPatchSchema,
  dataValidator,
)
export const contributorPatchResolver = resolve<
  Contributor,
  HookContext<ContributorService>
>({
  ...createUpdateResolver<Contributor>(),
  // Sanitize published_name by removing trailing commas and whitespace
  published_name: async (value: string | undefined) => {
    if (typeof value === 'string') {
      return value.replace(/[,\s]+$/, '').trim()
    }
    return value
  },
})

// Schema for allowed query properties
export const contributorQueryProperties = Type.Omit(contributorSchema, [])
export const contributorQuerySchema = Type.Intersect(
  [
    querySyntax(contributorQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type ContributorQuery = Static<typeof contributorQuerySchema>
export const contributorQueryValidator = getValidator(
  contributorQuerySchema,
  queryValidator,
)
export const contributorQueryResolver = resolve<
  ContributorQuery,
  HookContext<ContributorService>
>({})
