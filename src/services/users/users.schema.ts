import { passwordHash } from '@feathersjs/authentication-local'
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { formatISO } from 'date-fns'
import { dataValidator, queryValidator } from '../../validators'
// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import type { UserService } from './users.class'

// Main data model schema
export const userSchema = Type.Object(
  {
    id: Type.Integer(),
    email: Type.Optional(Type.String({ format: 'email' })),
    password: Type.Optional(Type.String()),
    googleId: Type.Optional(Type.String()),
    name: Type.String(),
    access_token: Type.Optional(Type.String()),
    access_token_expires: Type.Optional(Type.String()),
    refresh_token: Type.Optional(Type.String()),
    file_storage_id: Type.Optional(Type.String()),
    status: Type.Union([Type.Literal('active'), Type.Literal('archived')]),
    roles: Type.Array(
      Type.Union([
        Type.Literal('admin'),
        Type.Literal('productManager'),
        Type.Literal('editor'),
        Type.Literal('layoutDesigner'),
        Type.Literal('proofer'),
        Type.Literal('publisher'),
        Type.Literal('author'),
        Type.Literal('production'),
        Type.Literal('finance'),
      ]),
    ),
    allowed_imprints: Type.Array(Type.Integer()),
    allowed_books: Type.Array(Type.Integer()),
    pinned_books: Type.Array(Type.Integer()),
    fk_created_by: Type.Optional(Type.Integer()),
    created_at: Type.Optional(Type.String()),
    fk_updated_by: Type.Optional(Type.Integer()),
    updated_at: Type.Optional(Type.String()),
  },
  { $id: 'User', additionalProperties: false },
)
export type User = Static<typeof userSchema>
export const userValidator = getValidator(userSchema, dataValidator)
export const userResolver = resolve<User, HookContext<UserService>>({})

export const userExternalResolver = resolve<User, HookContext<UserService>>({
  // The password should never be visible externally
  password: async () => undefined,
})

// Schema for creating new entries
export const userDataSchema = Type.Omit(
  userSchema,
  ['id', 'fk_created_by', 'created_at', 'fk_updated_by', 'updated_at'],
  {
    $id: 'UserData',
  },
)
export type UserData = Static<typeof userDataSchema>
export const userDataValidator = getValidator(userDataSchema, dataValidator)
export const userDataResolver = resolve<User, HookContext<UserService>>({
  password: passwordHash({ strategy: 'local' }),
  created_at: async () => formatISO(new Date()),
  fk_created_by: async (value, data, context) => context.params.user?.id,
  updated_at: async () => formatISO(new Date()),
  fk_updated_by: async (value, data, context) => context.params.user?.id,
})

// Schema for updating existing entries
export const userPatchSchema = Type.Partial(userSchema, {
  $id: 'UserPatch',
})
export type UserPatch = Static<typeof userPatchSchema>
export const userPatchValidator = getValidator(userPatchSchema, dataValidator)
export const userPatchResolver = resolve<User, HookContext<UserService>>({
  password: passwordHash({ strategy: 'local' }),
  updated_at: async () => formatISO(new Date()),
  fk_updated_by: async (value, data, context) => context.params.user?.id,
})

// Schema for allowed query properties
export const userQueryProperties = Type.Omit(userSchema, ['password'])
export const userQuerySchema = Type.Intersect(
  [
    querySyntax(userQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type UserQuery = Static<typeof userQuerySchema>
export const userQueryValidator = getValidator(userQuerySchema, queryValidator)
export const userQueryResolver = resolve<UserQuery, HookContext<UserService>>({
  // If there is a user (e.g. with authentication), they are only allowed to see their own data
  id: async (value, user, context) => {
    if (context.params.user && !context.params.user.roles.includes('admin')) {
      return context.params.user.id
    }

    return value
  },
})
