import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import {
  createDataResolver,
  createUpdateResolver,
} from '../../utils/update-resolver'
import { dataValidator, queryValidator } from '../../validators'

import type { IssueService } from './issues.class'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'

// Main data model schema
export const issueSchema = Type.Object(
  {
    id: Type.Number(),
    fk_book: Type.Number(),
    book_title: Type.Optional(Type.String()),
    date: Type.String(),
    issue: Type.String(),
    entered_by: Type.String(),
    resolved: Type.Boolean(),
    fk_created_by: Type.Optional(Type.Integer()),
    created_at: Type.Optional(Type.String({ format: 'date-time' })),
    fk_updated_by: Type.Optional(Type.Integer()),
    updated_at: Type.Optional(Type.String({ format: 'date-time' })),
  },
  { $id: 'Issue', additionalProperties: false },
)
export type Issue = Static<typeof issueSchema>
export const issueValidator = getValidator(issueSchema, dataValidator)
export const issueResolver = resolve<Issue, HookContext<IssueService>>({
  // No need for virtual resolver as book_title now comes from the join
})

export const issueExternalResolver = resolve<Issue, HookContext<IssueService>>(
  {},
)

// Schema for creating new entries
export const issueDataSchema = Type.Omit(
  issueSchema,
  ['id', 'fk_created_by', 'created_at', 'fk_updated_by', 'updated_at'],
  {
    $id: 'IssueData',
  },
)
export type IssueData = Static<typeof issueDataSchema>
export const issueDataValidator = getValidator(issueDataSchema, dataValidator)
// Combine our standard data resolver with custom field handling
export const issueDataResolver = resolve<Issue, HookContext<IssueService>>({
  ...createDataResolver<Issue>(),
  // Explicitly return undefined for book_title to exclude it from validation
  book_title: () => undefined,
})

// Schema for updating existing entries
export const issuePatchSchema = Type.Partial(issueSchema, {
  $id: 'IssuePatch',
})
export type IssuePatch = Static<typeof issuePatchSchema>
export const issuePatchValidator = getValidator(issuePatchSchema, dataValidator)
export const issuePatchResolver = resolve<Issue, HookContext<IssueService>>({
  ...createUpdateResolver<Issue>(),
  // Explicitly return undefined for book_title to exclude it from validation
  book_title: () => undefined,
})

// Schema for allowed query properties
export const issueQueryProperties = Type.Omit(issueSchema, [])
export const issueQuerySchema = Type.Intersect(
  [
    querySyntax(issueQueryProperties),
    // Add additional query properties here
    Type.Object(
      {
        // Allow querying by book_title from the join
        book_title: Type.Optional(Type.String()),
      },
      { additionalProperties: false },
    ),
  ],
  { additionalProperties: false },
)
export type IssueQuery = Static<typeof issueQuerySchema>
export const issueQueryValidator = getValidator(
  issueQuerySchema,
  queryValidator,
)
export const issueQueryResolver = resolve<
  IssueQuery,
  HookContext<IssueService>
>({})
