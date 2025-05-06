// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { RefreshTokenService } from './refresh-token.class'

// Main data model schema
export const refreshTokenSchema = Type.Object(
  {
    id: Type.Number(),
    text: Type.String(),
  },
  { $id: 'RefreshToken', additionalProperties: false },
)
export type RefreshToken = Static<typeof refreshTokenSchema>
export const refreshTokenValidator = getValidator(
  refreshTokenSchema,
  dataValidator,
)
export const refreshTokenResolver = resolve<
  RefreshToken,
  HookContext<RefreshTokenService>
>({})

export const refreshTokenExternalResolver = resolve<
  RefreshToken,
  HookContext<RefreshTokenService>
>({})

// Schema for creating new entries
export const refreshTokenDataSchema = Type.Pick(refreshTokenSchema, ['text'], {
  $id: 'RefreshTokenData',
})
export type RefreshTokenData = Static<typeof refreshTokenDataSchema>
export const refreshTokenDataValidator = getValidator(
  refreshTokenDataSchema,
  dataValidator,
)
export const refreshTokenDataResolver = resolve<
  RefreshToken,
  HookContext<RefreshTokenService>
>({})

// Schema for updating existing entries
export const refreshTokenPatchSchema = Type.Partial(refreshTokenSchema, {
  $id: 'RefreshTokenPatch',
})
export type RefreshTokenPatch = Static<typeof refreshTokenPatchSchema>
export const refreshTokenPatchValidator = getValidator(
  refreshTokenPatchSchema,
  dataValidator,
)
export const refreshTokenPatchResolver = resolve<
  RefreshToken,
  HookContext<RefreshTokenService>
>({})

// Schema for allowed query properties
export const refreshTokenQueryProperties = Type.Pick(refreshTokenSchema, [
  'id',
  'text',
])
export const refreshTokenQuerySchema = Type.Intersect(
  [
    querySyntax(refreshTokenQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type RefreshTokenQuery = Static<typeof refreshTokenQuerySchema>
export const refreshTokenQueryValidator = getValidator(
  refreshTokenQuerySchema,
  queryValidator,
)
export const refreshTokenQueryResolver = resolve<
  RefreshTokenQuery,
  HookContext<RefreshTokenService>
>({})
