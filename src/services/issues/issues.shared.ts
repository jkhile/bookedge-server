// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Issue,
  IssueData,
  IssuePatch,
  IssueQuery,
  IssueService,
} from './issues.class'

export type { Issue, IssueData, IssuePatch, IssueQuery }

export type IssueClientService = Pick<
  IssueService<Params<IssueQuery>>,
  (typeof issueMethods)[number]
>

export const issuePath = 'issues'

export const issueMethods = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
] as const

export const issueClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(issuePath, connection.service(issuePath), {
    methods: issueMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [issuePath]: IssueClientService
  }
}
