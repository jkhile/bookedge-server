// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schema.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
// import { DataValidationError } from '@feathersjs/errors'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'

// Main data model schema
export const metadataSearchSchema = Type.Object(
  {
    fields: Type.Array(Type.String()),
    searchTerm: Type.String(),
  },
  { $id: 'MetadataSearch', additionalProperties: false },
)

export type MetadataSearch = Static<typeof metadataSearchSchema>
export const metadataSearchValidator = getValidator(
  metadataSearchSchema,
  dataValidator,
)
export const metadataSearchResolver = resolve<MetadataSearch, HookContext>({})

// Schema for the returned search results
export const metadataSearchResultSchema = Type.Object(
  {
    id: Type.Number(),
    title: Type.String(),
    headline: Type.String(),
  },
  { $id: 'MetadataSearchResult', additionalProperties: false },
)

export type MetadataSearchResult = Static<typeof metadataSearchResultSchema>

// Schema for allowed query properties
export const metadataSearchQueryProperties = Type.Pick(metadataSearchSchema, [
  'searchTerm',
  'fields',
])
export const metadataSearchQuerySchema = Type.Intersect(
  [
    querySyntax(metadataSearchQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)

export type MetadataSearchQuery = Static<typeof metadataSearchQuerySchema>
export const metadataSearchQueryValidator = getValidator(
  metadataSearchQuerySchema,
  queryValidator,
)
export const metadataSearchQueryResolver = resolve<
  MetadataSearchQuery,
  HookContext
>({})
