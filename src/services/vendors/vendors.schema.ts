import { dataValidator, queryValidator } from '../../validators'
import { getValidator, querySyntax, Type } from '@feathersjs/typebox'
import { resolve } from '@feathersjs/schema'
import {
  createDataResolver,
  createUpdateResolver,
} from '../../utils/update-resolver'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import type { VendorService } from './vendors.class'

// Main data model schema
export const vendorSchema = Type.Object(
  {
    id: Type.Integer(),
    code_prefix: Type.String(), // e.g., "MUN"
    vendor_name: Type.String(), // QB vendor display name
    statement_name: Type.String(), // Name on statements (defaults to vendor_name if empty)
    generate_individual_statements: Type.Boolean(),
    status: Type.Union([Type.Literal('active'), Type.Literal('archived')]),
    notes: Type.String(),
    fk_created_by: Type.Optional(Type.Integer()),
    created_at: Type.Optional(Type.String({ format: 'date-time' })),
    fk_updated_by: Type.Optional(Type.Integer()),
    updated_at: Type.Optional(Type.String({ format: 'date-time' })),
  },
  { $id: 'Vendor', additionalProperties: false },
)
export type Vendor = Static<typeof vendorSchema>
export const vendorValidator = getValidator(vendorSchema, dataValidator)
export const vendorResolver = resolve<Vendor, HookContext<VendorService>>({})

export const vendorExternalResolver = resolve<
  Vendor,
  HookContext<VendorService>
>({})

// Schema for creating new entries
export const vendorDataSchema = Type.Omit(
  vendorSchema,
  ['id', 'fk_created_by', 'created_at', 'fk_updated_by', 'updated_at'],
  {
    $id: 'VendorData',
  },
)
export type VendorData = Static<typeof vendorDataSchema>
export const vendorDataValidator = getValidator(vendorDataSchema, dataValidator)
export const vendorDataResolver = resolve<Vendor, HookContext<VendorService>>(
  createDataResolver<Vendor>(),
)

// Schema for updating existing entries
export const vendorPatchSchema = Type.Partial(vendorSchema, {
  $id: 'VendorPatch',
})
export type VendorPatch = Static<typeof vendorPatchSchema>
export const vendorPatchValidator = getValidator(
  vendorPatchSchema,
  dataValidator,
)
export const vendorPatchResolver = resolve<Vendor, HookContext<VendorService>>(
  createUpdateResolver<Vendor>(),
)

// Schema for allowed query properties
export const vendorQueryProperties = Type.Omit(vendorSchema, [])
export const vendorQuerySchema = Type.Intersect(
  [
    querySyntax(vendorQueryProperties),
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type VendorQuery = Static<typeof vendorQuerySchema>
export const vendorQueryValidator = getValidator(
  vendorQuerySchema,
  queryValidator,
)
export const vendorQueryResolver = resolve<
  VendorQuery,
  HookContext<VendorService>
>({})
