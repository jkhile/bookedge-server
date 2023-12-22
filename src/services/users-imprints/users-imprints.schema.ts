import { dataValidator, queryValidator } from '../../validators'
import { formatISO } from 'date-fns'
import { getValidator, querySyntax, Type } from '@feathersjs/typebox'
import { resolve } from '@feathersjs/schema'
// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import type { UsersImprintsService } from './users-imprints.class'

// Main data model schema
export const usersImprintsSchema = Type.Object(
  {
    id: Type.Integer(),
    fk_user: Type.Integer(),
    fk_imprint: Type.Integer(),
    fk_created_by: Type.Integer(),
    created_at: Type.String({ format: 'date-time' }),
  },
  { $id: 'UsersImprints', additionalProperties: false },
)
export type UsersImprints = Static<typeof usersImprintsSchema>
export const usersImprintsValidator = getValidator(
  usersImprintsSchema,
  dataValidator,
)
export const usersImprintsResolver = resolve<
  UsersImprints,
  HookContext<UsersImprintsService>
>({})

export const usersImprintsExternalResolver = resolve<
  UsersImprints,
  HookContext<UsersImprintsService>
>({})

// Schema for creating new entries
export const usersImprintsDataSchema = Type.Omit(
  usersImprintsSchema,
  ['id', 'fk_created_by', 'created_at'],
  {
    $id: 'UsersImprintsData',
  },
)
export type UsersImprintsData = Static<typeof usersImprintsDataSchema>
export const usersImprintsDataValidator = getValidator(
  usersImprintsDataSchema,
  dataValidator,
)
export const usersImprintsDataResolver = resolve<
  UsersImprints,
  HookContext<UsersImprintsService>
>({
  created_at: async () => formatISO(new Date()),
  fk_created_by: async (value, data, context) => context.params.user?.id,
})

// Schema for updating existing entries
export const usersImprintsPatchSchema = Type.Partial(usersImprintsSchema, {
  $id: 'UsersImprintsPatch',
})
export type UsersImprintsPatch = Static<typeof usersImprintsPatchSchema>
export const usersImprintsPatchValidator = getValidator(
  usersImprintsPatchSchema,
  dataValidator,
)
export const usersImprintsPatchResolver = resolve<
  UsersImprints,
  HookContext<UsersImprintsService>
>({})

// Schema for allowed query properties
export const usersImprintsQueryProperties = Type.Omit(usersImprintsSchema, [])
export const usersImprintsQuerySchema = Type.Intersect(
  [
    querySyntax(usersImprintsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type UsersImprintsQuery = Static<typeof usersImprintsQuerySchema>
export const usersImprintsQueryValidator = getValidator(
  usersImprintsQuerySchema,
  queryValidator,
)
export const usersImprintsQueryResolver = resolve<
  UsersImprintsQuery,
  HookContext<UsersImprintsService>
>({})
