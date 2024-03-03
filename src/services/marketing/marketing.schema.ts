import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { dataValidator, queryValidator } from '../../validators'
// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import type { MarketingService } from './marketing.class'

// Main data model schema
export const marketingSchema = Type.Object(
  {
    id: Type.Number(),
    fk_book: Type.Number(),
    goodreads_reviews_link: Type.String(),
    amazon_reviews_link: Type.String(),
    amazon_a_plus_link: Type.String(),
    a_plus_description_1: Type.String(),
    a_plus_text_1: Type.String(),
    a_plus_is_live_1: Type.Boolean(),
    a_plus_rejection_reason_1: Type.String(),
    a_plus_image_1: Type.String(),
    a_plus_description_2: Type.String(),
    a_plus_text_2: Type.String(),
    a_plus_is_live_2: Type.Boolean(),
    a_plus_rejection_reason_2: Type.String(),
    a_plus_image_2: Type.String(),
    a_plus_description_3: Type.String(),
    a_plus_text_3: Type.String(),
    a_plus_is_live_3: Type.Boolean(),
    a_plus_rejection_reason_3: Type.String(),
    a_plus_image_3: Type.String(),
    notes: Type.String(),
    fk_created_by: Type.Integer(),
    created_at: Type.String({ format: 'date-time' }),
  },
  { $id: 'Marketing', additionalProperties: false },
)
export type Marketing = Static<typeof marketingSchema>
export const marketingValidator = getValidator(marketingSchema, dataValidator)
export const marketingResolver = resolve<
  Marketing,
  HookContext<MarketingService>
>({})

export const marketingExternalResolver = resolve<
  Marketing,
  HookContext<MarketingService>
>({})

// Schema for creating new entries
export const marketingDataSchema = Type.Omit(
  marketingSchema,
  ['id', 'fk_created_by', 'created_at'],
  {
    $id: 'MarketingData',
  },
)
export type MarketingData = Static<typeof marketingDataSchema>
export const marketingDataValidator = getValidator(
  marketingDataSchema,
  dataValidator,
)
export const marketingDataResolver = resolve<
  Marketing,
  HookContext<MarketingService>
>({})

// Schema for updating existing entries
export const marketingPatchSchema = Type.Partial(marketingSchema, {
  $id: 'MarketingPatch',
})
export type MarketingPatch = Static<typeof marketingPatchSchema>
export const marketingPatchValidator = getValidator(
  marketingPatchSchema,
  dataValidator,
)
export const marketingPatchResolver = resolve<
  Marketing,
  HookContext<MarketingService>
>({})

// Schema for allowed query properties
export const marketingQueryProperties = Type.Omit(marketingSchema, [])
export const marketingQuerySchema = Type.Intersect(
  [
    querySyntax(marketingQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type MarketingQuery = Static<typeof marketingQuerySchema>
export const marketingQueryValidator = getValidator(
  marketingQuerySchema,
  queryValidator,
)
export const marketingQueryResolver = resolve<
  MarketingQuery,
  HookContext<MarketingService>
>({})
