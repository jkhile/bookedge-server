import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { formatISO } from 'date-fns'
import { dataValidator, queryValidator } from '../../validators'
// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import type { ReleaseService } from './releases.class'

// Main data model schema
export const releaseSchema = Type.Object(
  {
    id: Type.Number(),
    fk_book: Type.Number(),
    status: Type.Union([Type.Literal('active'), Type.Literal('archived')]),
    release_type: Type.Union([
      Type.Literal(''),
      Type.Literal('print-LSI'),
      Type.Literal('kindle'),
      Type.Literal('epub'),
      Type.Literal('pdf'),
      Type.Literal('apple'),
      Type.Literal('nook'),
      Type.Literal('kobo'),
      Type.Literal('google'),
    ]),
    submission_date: Type.String(),
    acceptance_date: Type.String(),
    pre_order_date: Type.String(),
    publication_date: Type.String(),
    preorder: Type.Boolean(),
    sku: Type.String(),
    trim_size: Type.String(),
    binding: Type.Union([
      Type.Literal(''),
      Type.Literal('case laminate'),
      Type.Literal('perfect bound'),
      Type.Literal('digital cloth - blue'),
      Type.Literal('digital cloth - gray'),
      Type.Literal('jacketed case laminate'),
    ]),
    page_count: Type.Number(),
    spine_width: Type.Number(),
    color: Type.Union([
      Type.Literal(''),
      Type.Literal('black & white'),
      Type.Literal('color'),
    ]),
    paper: Type.Union([
      Type.Literal(''),
      Type.Literal('creme'),
      Type.Literal('white'),
      Type.Literal('50 white'),
      Type.Literal('70 white'),
      Type.Literal('premium color'),
      Type.Literal('ultra premium color'),
    ]),
    cover_finish: Type.Union([
      Type.Literal(''),
      Type.Literal('glossy'),
      Type.Literal('matte'),
    ]),
    carton_quantity: Type.Number(),
    weight: Type.Number(),
    full_distribution: Type.Boolean(),
    enable_look_inside: Type.Boolean(),
    kdp_select: Type.Boolean(),
    kdp_match_book: Type.Boolean(),
    asin: Type.String(),
    drm: Type.Boolean(),
    amazon_sales_page: Type.String(),
    bn_sales_page: Type.String(),
    apple_sales_page: Type.String(),
    kobo_sales_page: Type.String(),
    google_sales_page: Type.String(),
    notes: Type.String(),
    fk_created_by: Type.Integer(),
    created_at: Type.String({ format: 'date-time' }),
  },
  { $id: 'Release', additionalProperties: false },
)
export type Release = Static<typeof releaseSchema>
export const releaseValidator = getValidator(releaseSchema, dataValidator)
export const releaseResolver = resolve<Release, HookContext<ReleaseService>>({})

export const releaseExternalResolver = resolve<
  Release,
  HookContext<ReleaseService>
>({})

// Schema for creating new entries
export const releaseDataSchema = Type.Omit(
  releaseSchema,
  ['id', 'fk_created_by', 'created_at'],
  {
    $id: 'ReleaseData',
  },
)
export type ReleaseData = Static<typeof releaseDataSchema>
export const releaseDataValidator = getValidator(
  releaseDataSchema,
  dataValidator,
)
export const releaseDataResolver = resolve<
  Release,
  HookContext<ReleaseService>
>({
  created_at: async () => formatISO(new Date()),
  fk_created_by: async (value, data, context) => context.params.user?.id,
})

// Schema for updating existing entries
export const releasePatchSchema = Type.Partial(releaseSchema, {
  $id: 'ReleasePatch',
})
export type ReleasePatch = Static<typeof releasePatchSchema>
export const releasePatchValidator = getValidator(
  releasePatchSchema,
  dataValidator,
)
export const releasePatchResolver = resolve<
  Release,
  HookContext<ReleaseService>
>({})

// Schema for allowed query properties
export const releaseQueryProperties = Type.Omit(releaseSchema, [])
export const releaseQuerySchema = Type.Intersect(
  [
    querySyntax(releaseQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type ReleaseQuery = Static<typeof releaseQuerySchema>
export const releaseQueryValidator = getValidator(
  releaseQuerySchema,
  queryValidator,
)
export const releaseQueryResolver = resolve<
  ReleaseQuery,
  HookContext<ReleaseService>
>({})
