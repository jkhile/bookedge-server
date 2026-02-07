// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import { dataValidator, queryValidator } from '../../validators'
import type { HookContext } from '../../declarations'

// Main data model schema
export const contributorSocialsSchema = Type.Object(
  {
    id: Type.Number(),
    contributor_id: Type.Number(),
    platform: Type.String({ maxLength: 50 }),
    url: Type.String(),
    created_at: Type.Optional(Type.String({ format: 'date-time' })),
    updated_at: Type.Optional(Type.String({ format: 'date-time' })),
  },
  { $id: 'ContributorSocials', additionalProperties: false },
)
export type ContributorSocials = Static<typeof contributorSocialsSchema>
export const contributorSocialsValidator = getValidator(
  contributorSocialsSchema,
  dataValidator,
)
export const contributorSocialsResolver = resolve<
  ContributorSocials,
  HookContext
>({})

export const contributorSocialsExternalResolver = resolve<
  ContributorSocials,
  HookContext
>({})

// Schema for creating new entries
export const contributorSocialsDataSchema = Type.Pick(
  contributorSocialsSchema,
  ['contributor_id', 'platform', 'url'],
  { $id: 'ContributorSocialsData' },
)
export type ContributorSocialsData = Static<typeof contributorSocialsDataSchema>
export const contributorSocialsDataValidator = getValidator(
  contributorSocialsDataSchema,
  dataValidator,
)
export const contributorSocialsDataResolver = resolve<
  ContributorSocials,
  HookContext
>({})

// Schema for updating existing entries
export const contributorSocialsPatchSchema = Type.Partial(
  Type.Pick(contributorSocialsSchema, ['platform', 'url']),
  { $id: 'ContributorSocialsPatch' },
)
export type ContributorSocialsPatch = Static<
  typeof contributorSocialsPatchSchema
>
export const contributorSocialsPatchValidator = getValidator(
  contributorSocialsPatchSchema,
  dataValidator,
)
export const contributorSocialsPatchResolver = resolve<
  ContributorSocials,
  HookContext
>({})

// Schema for allowed query properties
export const contributorSocialsQueryProperties = Type.Pick(
  contributorSocialsSchema,
  ['id', 'contributor_id', 'platform'],
)
export const contributorSocialsQuerySchema = Type.Intersect(
  [
    querySyntax(contributorSocialsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type ContributorSocialsQuery = Static<
  typeof contributorSocialsQuerySchema
>
export const contributorSocialsQueryValidator = getValidator(
  contributorSocialsQuerySchema,
  queryValidator,
)
export const contributorSocialsQueryResolver = resolve<
  ContributorSocialsQuery,
  HookContext
>({})
