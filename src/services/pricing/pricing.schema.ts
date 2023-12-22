import { dataValidator, queryValidator } from '../../validators'
import { getValidator, querySyntax, Type } from '@feathersjs/typebox'
import { resolve } from '@feathersjs/schema'
// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import type { PricingService } from './pricing.class'

// Main data model schema
export const pricingSchema = Type.Object(
  {
    id: Type.Number(),
    fk_release: Type.Number(),
    start_date: Type.String(),
    expiration_date: Type.String(),
    US_srp: Type.Number(),
    US_discount: Type.Number(),
    US_returnable: Type.String(),
    UK_srp: Type.Number(),
    UK_discount: Type.Number(),
    UK_returnable: Type.String(),
    EU_srp: Type.Number(),
    EU_discount: Type.Number(),
    EU_returnable: Type.String(),
    CA_srp: Type.Number(),
    CA_discount: Type.Number(),
    CA_returnable: Type.String(),
    AU_srp: Type.Number(),
    AU_discount: Type.Number(),
    AU_returnable: Type.String(),
    GC_srp: Type.Number(),
    GC_discount: Type.Number(),
    GC_returnable: Type.String(),
    fk_created_by: Type.Integer(),
    created_at: Type.String({ format: 'date-time' }),
  },
  { $id: 'Pricing', additionalProperties: false },
)
export type Pricing = Static<typeof pricingSchema>
export const pricingValidator = getValidator(pricingSchema, dataValidator)
export const pricingResolver = resolve<Pricing, HookContext<PricingService>>({})

export const pricingExternalResolver = resolve<
  Pricing,
  HookContext<PricingService>
>({})

// Schema for creating new entries
export const pricingDataSchema = Type.Omit(
  pricingSchema,
  ['id', 'fk_created_by', 'created_at'],
  {
    $id: 'PricingData',
  },
)
export type PricingData = Static<typeof pricingDataSchema>
export const pricingDataValidator = getValidator(
  pricingDataSchema,
  dataValidator,
)
export const pricingDataResolver = resolve<
  Pricing,
  HookContext<PricingService>
>({})

// Schema for updating existing entries
export const pricingPatchSchema = Type.Partial(pricingSchema, {
  $id: 'PricingPatch',
})
export type PricingPatch = Static<typeof pricingPatchSchema>
export const pricingPatchValidator = getValidator(
  pricingPatchSchema,
  dataValidator,
)
export const pricingPatchResolver = resolve<
  Pricing,
  HookContext<PricingService>
>({})

// Schema for allowed query properties
export const pricingQueryProperties = Type.Omit(pricingSchema, [])
export const pricingQuerySchema = Type.Intersect(
  [
    querySyntax(pricingQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type PricingQuery = Static<typeof pricingQuerySchema>
export const pricingQueryValidator = getValidator(
  pricingQuerySchema,
  queryValidator,
)
export const pricingQueryResolver = resolve<
  PricingQuery,
  HookContext<PricingService>
>({})
