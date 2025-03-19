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
import type { ReviewQuotesService } from './review-quotes.class'

// Main data model schema
export const reviewQuotesSchema = Type.Object(
  {
    id: Type.Number(),
    fk_book: Type.Number(),
    quote_text: Type.String(),
    reviewer: Type.String(),
    fk_created_by: Type.Optional(Type.Integer()),
    created_at: Type.Optional(Type.String({ format: 'date-time' })),
    fk_updated_by: Type.Optional(Type.Integer()),
    updated_at: Type.Optional(Type.String({ format: 'date-time' })),
  },
  { $id: 'ReviewQuotes', additionalProperties: false },
)
export type ReviewQuotes = Static<typeof reviewQuotesSchema>
export const reviewQuotesValidator = getValidator(
  reviewQuotesSchema,
  dataValidator,
)
export const reviewQuotesResolver = resolve<
  ReviewQuotes,
  HookContext<ReviewQuotesService>
>({})

export const reviewQuotesExternalResolver = resolve<
  ReviewQuotes,
  HookContext<ReviewQuotesService>
>({})

// Schema for creating new entries
export const reviewQuotesDataSchema = Type.Omit(
  reviewQuotesSchema,
  ['id', 'fk_created_by', 'created_at', 'fk_updated_by', 'updated_at'],
  {
    $id: 'ReviewQuotesData',
  },
)
export type ReviewQuotesData = Static<typeof reviewQuotesDataSchema>
export const reviewQuotesDataValidator = getValidator(
  reviewQuotesDataSchema,
  dataValidator,
)
export const reviewQuotesDataResolver = resolve<
  ReviewQuotes,
  HookContext<ReviewQuotesService>
>(createDataResolver<ReviewQuotes>())

// Schema for updating existing entries
export const reviewQuotesPatchSchema = Type.Partial(reviewQuotesSchema, {
  $id: 'ReviewQuotesPatch',
})
export type ReviewQuotesPatch = Static<typeof reviewQuotesPatchSchema>
export const reviewQuotesPatchValidator = getValidator(
  reviewQuotesPatchSchema,
  dataValidator,
)
export const reviewQuotesPatchResolver = resolve<
  ReviewQuotes,
  HookContext<ReviewQuotesService>
>(createUpdateResolver<ReviewQuotes>())

// Schema for allowed query properties
export const reviewQuotesQueryProperties = Type.Omit(reviewQuotesSchema, [])
export const reviewQuotesQuerySchema = Type.Intersect(
  [
    querySyntax(reviewQuotesQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type ReviewQuotesQuery = Static<typeof reviewQuotesQuerySchema>
export const reviewQuotesQueryValidator = getValidator(
  reviewQuotesQuerySchema,
  queryValidator,
)
export const reviewQuotesQueryResolver = resolve<
  ReviewQuotesQuery,
  HookContext<ReviewQuotesService>
>({})
