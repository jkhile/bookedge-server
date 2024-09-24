// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { SigninHistoryService } from './signin-history.class'

// Main data model schema
export const signinHistorySchema = Type.Object(
  {
    id: Type.Number(),
    op: Type.String(),
    strategy: Type.String(),
    fk_user: Type.Number(),
    user_email: Type.String(),
    user_name: Type.String(),
    datetime: Type.String(),
  },
  { $id: 'SigninHistory', additionalProperties: false },
)
export type SigninHistory = Static<typeof signinHistorySchema>
export const signinHistoryValidator = getValidator(
  signinHistorySchema,
  dataValidator,
)
export const signinHistoryResolver = resolve<
  SigninHistory,
  HookContext<SigninHistoryService>
>({})

export const signinHistoryExternalResolver = resolve<
  SigninHistory,
  HookContext<SigninHistoryService>
>({})

// Schema for creating new entries
export const signinHistoryDataSchema = Type.Omit(signinHistorySchema, ['id'], {
  $id: 'SigninHistoryData',
})
export type SigninHistoryData = Static<typeof signinHistoryDataSchema>
export const signinHistoryDataValidator = getValidator(
  signinHistoryDataSchema,
  dataValidator,
)
export const signinHistoryDataResolver = resolve<
  SigninHistory,
  HookContext<SigninHistoryService>
>({})

// Schema for updating existing entries
export const signinHistoryPatchSchema = Type.Partial(signinHistorySchema, {
  $id: 'SigninHistoryPatch',
})
export type SigninHistoryPatch = Static<typeof signinHistoryPatchSchema>
export const signinHistoryPatchValidator = getValidator(
  signinHistoryPatchSchema,
  dataValidator,
)
export const signinHistoryPatchResolver = resolve<
  SigninHistory,
  HookContext<SigninHistoryService>
>({})

// Schema for allowed query properties
export const signinHistoryQueryProperties = Type.Omit(signinHistorySchema, [])
export const signinHistoryQuerySchema = Type.Intersect(
  [
    querySyntax(signinHistoryQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type SigninHistoryQuery = Static<typeof signinHistoryQuerySchema>
export const signinHistoryQueryValidator = getValidator(
  signinHistoryQuerySchema,
  queryValidator,
)
export const signinHistoryQueryResolver = resolve<
  SigninHistoryQuery,
  HookContext<SigninHistoryService>
>({})
