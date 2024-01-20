import { dataValidator, queryValidator } from '../../validators'
import { formatISO } from 'date-fns'
import { getValidator, querySyntax, Type } from '@feathersjs/typebox'
import { imprintsResolver } from '../../utils/imprints-resolver'
import { resolve } from '@feathersjs/schema'
// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import type { ImprintService } from './imprints.class'

// Main data model schema
export const imprintSchema = Type.Object(
  {
    id: Type.Integer(),
    imprint_name: Type.String(),
    accounting_code: Type.String(),
    status: Type.Union([Type.Literal('active'), Type.Literal('inactive')]),
    contact_name: Type.String(),
    address1: Type.String(),
    address2: Type.String(),
    city: Type.String(),
    state: Type.String(),
    postal_code: Type.String(),
    country: Type.String(),
    email: Type.String(),
    phone: Type.String(),
    notes: Type.String(),
    fk_created_by: Type.Integer(),
    created_at: Type.String({ format: 'date-time' }),
  },
  { $id: 'Imprint', additionalProperties: false },
)
export type Imprint = Static<typeof imprintSchema>
export const imprintValidator = getValidator(imprintSchema, dataValidator)
export const imprintResolver = resolve<Imprint, HookContext<ImprintService>>({})

export const imprintExternalResolver = resolve<
  Imprint,
  HookContext<ImprintService>
>({})

// Schema for creating new entries
export const imprintDataSchema = Type.Omit(
  imprintSchema,
  ['id', 'fk_created_by', 'created_at'],
  {
    $id: 'ImprintData',
  },
)
export type ImprintData = Static<typeof imprintDataSchema>
export const imprintDataValidator = getValidator(
  imprintDataSchema,
  dataValidator,
)
export const imprintDataResolver = resolve<
  Imprint,
  HookContext<ImprintService>
>({
  created_at: async () => formatISO(new Date()),
  fk_created_by: async (value, data, context) => context.params.user?.id,
})

// Schema for updating existing entries
export const imprintPatchSchema = Type.Partial(imprintSchema, {
  $id: 'ImprintPatch',
})
export type ImprintPatch = Static<typeof imprintPatchSchema>
export const imprintPatchValidator = getValidator(
  imprintPatchSchema,
  dataValidator,
)
export const imprintPatchResolver = resolve<
  Imprint,
  HookContext<ImprintService>
>({})

// Schema for allowed query properties
export const imprintQueryProperties = Type.Omit(imprintSchema, [])
export const imprintQuerySchema = Type.Intersect(
  [
    querySyntax(imprintQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type ImprintQuery = Static<typeof imprintQuerySchema>
export const imprintQueryValidator = getValidator(
  imprintQuerySchema,
  queryValidator,
)
export const imprintQueryResolver = resolve<
  ImprintQuery,
  HookContext<ImprintService>
>({
  id: imprintsResolver,
})
