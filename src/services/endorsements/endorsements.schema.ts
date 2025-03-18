// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import {
  createDataResolver,
  createUpdateResolver,
} from '../../utils/update-resolver'

import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { EndorsementService } from './endorsements.class'

// Main data model schema
export const endorsementSchema = Type.Object(
  {
    id: Type.Number(),
    fk_book: Type.Number(),
    date: Type.String(),
    by: Type.String(),
    priority: Type.Integer(),
    text: Type.String(),
    notes: Type.String(),
    fk_created_by: Type.Optional(Type.Integer()),
    created_at: Type.Optional(Type.String({ format: 'date-time' })),
    fk_updated_by: Type.Optional(Type.Integer()),
    updated_at: Type.Optional(Type.String({ format: 'date-time' })),
  },
  { $id: 'Endorsement', additionalProperties: false },
)
export type Endorsement = Static<typeof endorsementSchema>
export const endorsementValidator = getValidator(
  endorsementSchema,
  dataValidator,
)
export const endorsementResolver = resolve<
  Endorsement,
  HookContext<EndorsementService>
>({})

export const endorsementExternalResolver = resolve<
  Endorsement,
  HookContext<EndorsementService>
>({})

// Schema for creating new entries
export const endorsementDataSchema = Type.Omit(
  endorsementSchema,
  ['id', 'fk_created_by', 'created_at', 'fk_updated_by', 'updated_at'],
  {
    $id: 'EndorsementData',
  },
)
export type EndorsementData = Static<typeof endorsementDataSchema>
export const endorsementDataValidator = getValidator(
  endorsementDataSchema,
  dataValidator,
)
export const endorsementDataResolver = createDataResolver<Endorsement>()

// Schema for updating existing entries
export const endorsementPatchSchema = Type.Partial(endorsementSchema, {
  $id: 'EndorsementPatch',
})
export type EndorsementPatch = Static<typeof endorsementPatchSchema>
export const endorsementPatchValidator = getValidator(
  endorsementPatchSchema,
  dataValidator,
)
export const endorsementPatchResolver = createUpdateResolver<Endorsement>()

// Schema for allowed query properties
export const endorsementQueryProperties = Type.Omit(endorsementSchema, [])
export const endorsementQuerySchema = Type.Intersect(
  [
    querySyntax(endorsementQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type EndorsementQuery = Static<typeof endorsementQuerySchema>
export const endorsementQueryValidator = getValidator(
  endorsementQuerySchema,
  queryValidator,
)
export const endorsementQueryResolver = resolve<
  EndorsementQuery,
  HookContext<EndorsementService>
>({})
