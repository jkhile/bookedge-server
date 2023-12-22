import { dataValidator, queryValidator } from '../../validators'
import { getValidator, querySyntax, Type } from '@feathersjs/typebox'
import { resolve } from '@feathersjs/schema'
// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import type { BooksHistoryService } from './books-history.class'

// Main data model schema
export const booksHistorySchema = Type.Object(
  {
    id: Type.Number(),
    fk_book: Type.Number(),
    fk_user: Type.Number(),
    user_email: Type.String(),
    change_date: Type.String(),
    op: Type.Union([
      Type.Literal('add'),
      Type.Literal('replace'),
      Type.Literal('remove'),
    ]),
    path: Type.String(),
    value: Type.Any(),
  },
  { $id: 'BooksHistory', additionalProperties: false },
)
export type BooksHistory = Static<typeof booksHistorySchema>
export const booksHistoryValidator = getValidator(
  booksHistorySchema,
  dataValidator,
)
export const booksHistoryResolver = resolve<
  BooksHistory,
  HookContext<BooksHistoryService>
>({})

export const booksHistoryExternalResolver = resolve<
  BooksHistory,
  HookContext<BooksHistoryService>
>({})

// Schema for creating new entries
export const booksHistoryDataSchema = Type.Omit(booksHistorySchema, ['id'], {
  $id: 'BooksHistoryData',
})
export type BooksHistoryData = Static<typeof booksHistoryDataSchema>
export const booksHistoryDataValidator = getValidator(
  booksHistoryDataSchema,
  dataValidator,
)
export const booksHistoryDataResolver = resolve<
  BooksHistory,
  HookContext<BooksHistoryService>
>({})

// Schema for updating existing entries
export const booksHistoryPatchSchema = Type.Partial(booksHistorySchema, {
  $id: 'BooksHistoryPatch',
})
export type BooksHistoryPatch = Static<typeof booksHistoryPatchSchema>
export const booksHistoryPatchValidator = getValidator(
  booksHistoryPatchSchema,
  dataValidator,
)
export const booksHistoryPatchResolver = resolve<
  BooksHistory,
  HookContext<BooksHistoryService>
>({})

// Schema for allowed query properties
export const booksHistoryQueryProperties = Type.Omit(booksHistorySchema, [])
export const booksHistoryQuerySchema = Type.Intersect(
  [
    querySyntax(booksHistoryQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type BooksHistoryQuery = Static<typeof booksHistoryQuerySchema>
export const booksHistoryQueryValidator = getValidator(
  booksHistoryQuerySchema,
  queryValidator,
)
export const booksHistoryQueryResolver = resolve<
  BooksHistoryQuery,
  HookContext<BooksHistoryService>
>({})
