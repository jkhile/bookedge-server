// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import {
  createDataResolver,
  createUpdateResolver,
} from '../../utils/update-resolver'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { MentionsService } from './mentions.class'

// Main data model schema
export const mentionsSchema = Type.Object(
  {
    id: Type.Number(),
    fk_book: Type.Number(),
    url: Type.String(),
    source: Type.String(),
    headline: Type.String(),
    date: Type.String(),
    byline: Type.String(),
    fk_created_by: Type.Optional(Type.Integer()),
    created_at: Type.Optional(Type.String({ format: 'date-time' })),
    fk_updated_by: Type.Optional(Type.Integer()),
    updated_at: Type.Optional(Type.String({ format: 'date-time' })),
  },
  { $id: 'Mentions', additionalProperties: false },
)
export type Mentions = Static<typeof mentionsSchema>
export const mentionsValidator = getValidator(mentionsSchema, dataValidator)
export const mentionsResolver = resolve<Mentions, HookContext<MentionsService>>(
  {},
)

export const mentionsExternalResolver = resolve<
  Mentions,
  HookContext<MentionsService>
>({})

// Schema for creating new entries
export const mentionsDataSchema = Type.Omit(
  mentionsSchema,
  ['id', 'fk_created_by', 'created_at', 'fk_updated_by', 'updated_at'],
  {
    $id: 'MentionsData',
  },
)
export type MentionsData = Static<typeof mentionsDataSchema>
export const mentionsDataValidator = getValidator(
  mentionsDataSchema,
  dataValidator,
)
export const mentionsDataResolver = resolve<
  Mentions,
  HookContext<MentionsService>
>(createDataResolver<Mentions>())

// Schema for updating existing entries
export const mentionsPatchSchema = Type.Partial(mentionsSchema, {
  $id: 'MentionsPatch',
})
export type MentionsPatch = Static<typeof mentionsPatchSchema>
export const mentionsPatchValidator = getValidator(
  mentionsPatchSchema,
  dataValidator,
)
export const mentionsPatchResolver = resolve<
  Mentions,
  HookContext<MentionsService>
>(createUpdateResolver<Mentions>())

// Schema for allowed query properties
export const mentionsQueryProperties = Type.Omit(mentionsSchema, [])
export const mentionsQuerySchema = Type.Intersect(
  [
    querySyntax(mentionsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type MentionsQuery = Static<typeof mentionsQuerySchema>
export const mentionsQueryValidator = getValidator(
  mentionsQuerySchema,
  queryValidator,
)
export const mentionsQueryResolver = resolve<
  MentionsQuery,
  HookContext<MentionsService>
>({})
