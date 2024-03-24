// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { IssueService } from './issues.class'

// Main data model schema
export const issueSchema = Type.Object(
  {
    id: Type.Number(),
    fk_book: Type.Number(),
    date: Type.String(),
    issue: Type.String(),
    resolved: Type.Boolean(),
    fk_created_by: Type.Integer(),
    created_at: Type.String({ format: 'date-time' }),
  },
  { $id: 'Issue', additionalProperties: false },
)
export type Issue = Static<typeof issueSchema>
export const issueValidator = getValidator(issueSchema, dataValidator)
export const issueResolver = resolve<Issue, HookContext<IssueService>>({})

export const issueExternalResolver = resolve<Issue, HookContext<IssueService>>(
  {},
)

// Schema for creating new entries
export const issueDataSchema = Type.Omit(
  issueSchema,
  ['id', 'fk_created_by', 'created_at'],
  {
    $id: 'IssueData',
  },
)
export type IssueData = Static<typeof issueDataSchema>
export const issueDataValidator = getValidator(issueDataSchema, dataValidator)
export const issueDataResolver = resolve<Issue, HookContext<IssueService>>({})

// Schema for updating existing entries
export const issuePatchSchema = Type.Partial(issueSchema, {
  $id: 'IssuePatch',
})
export type IssuePatch = Static<typeof issuePatchSchema>
export const issuePatchValidator = getValidator(issuePatchSchema, dataValidator)
export const issuePatchResolver = resolve<Issue, HookContext<IssueService>>({})

// Schema for allowed query properties
export const issueQueryProperties = Type.Omit(issueSchema, [])
export const issueQuerySchema = Type.Intersect(
  [
    querySyntax(issueQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
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
