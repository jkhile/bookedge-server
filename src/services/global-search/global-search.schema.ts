// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schema.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'

// Schema for individual book result
export const globalSearchBookResultSchema = Type.Object(
  {
    id: Type.Number(),
    title: Type.String(),
    author: Type.Optional(Type.String()),
    accounting_code: Type.Optional(Type.String()),
    imprint: Type.Optional(Type.String()),
  },
  { $id: 'GlobalSearchBookResult', additionalProperties: false },
)

export type GlobalSearchBookResult = Static<typeof globalSearchBookResultSchema>

// Schema for individual contributor result
export const globalSearchContributorResultSchema = Type.Object(
  {
    id: Type.Number(),
    published_name: Type.String(),
    legal_name: Type.Optional(Type.String()),
    book_id: Type.Optional(Type.Number()), // First associated book for navigation
  },
  { $id: 'GlobalSearchContributorResult', additionalProperties: false },
)

export type GlobalSearchContributorResult = Static<
  typeof globalSearchContributorResultSchema
>

// Schema for individual vendor result
export const globalSearchVendorResultSchema = Type.Object(
  {
    id: Type.Number(),
    vendor_name: Type.String(),
    code_prefix: Type.Optional(Type.String()),
  },
  { $id: 'GlobalSearchVendorResult', additionalProperties: false },
)

export type GlobalSearchVendorResult = Static<
  typeof globalSearchVendorResultSchema
>

// Main result schema combining all entity types
export const globalSearchResultSchema = Type.Object(
  {
    books: Type.Array(globalSearchBookResultSchema),
    contributors: Type.Array(globalSearchContributorResultSchema),
    vendors: Type.Array(globalSearchVendorResultSchema),
  },
  { $id: 'GlobalSearchResult', additionalProperties: false },
)

export type GlobalSearchResult = Static<typeof globalSearchResultSchema>

// Query schema for the search
export const globalSearchSchema = Type.Object(
  {
    query: Type.String({ minLength: 2 }),
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 20, default: 5 })),
  },
  { $id: 'GlobalSearch', additionalProperties: false },
)

export type GlobalSearch = Static<typeof globalSearchSchema>
export const globalSearchValidator = getValidator(
  globalSearchSchema,
  dataValidator,
)
export const globalSearchResolver = resolve<GlobalSearch, HookContext>({})

// Schema for allowed query properties
export const globalSearchQueryProperties = Type.Pick(globalSearchSchema, [
  'query',
  'limit',
])
export const globalSearchQuerySchema = Type.Intersect(
  [
    querySyntax(globalSearchQueryProperties),
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)

export type GlobalSearchQuery = Static<typeof globalSearchQuerySchema>
export const globalSearchQueryValidator = getValidator(
  globalSearchQuerySchema,
  queryValidator,
)
export const globalSearchQueryResolver = resolve<
  GlobalSearchQuery,
  HookContext
>({})
