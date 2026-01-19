// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import {
  createDataResolver,
  createUpdateResolver,
} from '../../utils/update-resolver'

import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { RevenueSplitOverrideService } from './revenue-split-overrides.class'

// Main data model schema
export const revenueSplitOverrideSchema = Type.Object(
  {
    id: Type.Number(),
    fk_book: Type.Number(),
    platform: Type.String(),
    fep_fixed_amount: Type.Union([Type.Number(), Type.Null()]),
    fep_percentage: Type.Union([Type.Number(), Type.Null()]),
    pub_fixed_amount: Type.Union([Type.Number(), Type.Null()]),
    pub_percentage: Type.Union([Type.Number(), Type.Null()]),
    fk_created_by: Type.Optional(Type.Integer()),
    created_at: Type.Optional(Type.String({ format: 'date-time' })),
    fk_updated_by: Type.Optional(Type.Integer()),
    updated_at: Type.Optional(Type.String({ format: 'date-time' })),
  },
  { $id: 'RevenueSplitOverride', additionalProperties: false },
)
export type RevenueSplitOverride = Static<typeof revenueSplitOverrideSchema>
export const revenueSplitOverrideValidator = getValidator(
  revenueSplitOverrideSchema,
  dataValidator,
)
export const revenueSplitOverrideResolver = resolve<
  RevenueSplitOverride,
  HookContext<RevenueSplitOverrideService>
>({})

export const revenueSplitOverrideExternalResolver = resolve<
  RevenueSplitOverride,
  HookContext<RevenueSplitOverrideService>
>({})

// Schema for creating new entries
export const revenueSplitOverrideDataSchema = Type.Omit(
  revenueSplitOverrideSchema,
  ['id', 'fk_created_by', 'created_at', 'fk_updated_by', 'updated_at'],
  {
    $id: 'RevenueSplitOverrideData',
  },
)
export type RevenueSplitOverrideData = Static<
  typeof revenueSplitOverrideDataSchema
>
export const revenueSplitOverrideDataValidator = getValidator(
  revenueSplitOverrideDataSchema,
  dataValidator,
)
export const revenueSplitOverrideDataResolver = resolve<
  RevenueSplitOverride,
  HookContext<RevenueSplitOverrideService>
>(createDataResolver<RevenueSplitOverride>())

// Schema for updating existing entries
export const revenueSplitOverridePatchSchema = Type.Partial(
  revenueSplitOverrideSchema,
  {
    $id: 'RevenueSplitOverridePatch',
  },
)
export type RevenueSplitOverridePatch = Static<
  typeof revenueSplitOverridePatchSchema
>
export const revenueSplitOverridePatchValidator = getValidator(
  revenueSplitOverridePatchSchema,
  dataValidator,
)
export const revenueSplitOverridePatchResolver = resolve<
  RevenueSplitOverride,
  HookContext<RevenueSplitOverrideService>
>(createUpdateResolver<RevenueSplitOverride>())

// Schema for allowed query properties
export const revenueSplitOverrideQueryProperties = Type.Omit(
  revenueSplitOverrideSchema,
  [],
)
export const revenueSplitOverrideQuerySchema = Type.Intersect(
  [
    querySyntax(revenueSplitOverrideQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type RevenueSplitOverrideQuery = Static<
  typeof revenueSplitOverrideQuerySchema
>
export const revenueSplitOverrideQueryValidator = getValidator(
  revenueSplitOverrideQuerySchema,
  queryValidator,
)
export const revenueSplitOverrideQueryResolver = resolve<
  RevenueSplitOverrideQuery,
  HookContext<RevenueSplitOverrideService>
>({})
