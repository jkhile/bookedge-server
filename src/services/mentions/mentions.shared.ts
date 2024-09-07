// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Mentions,
  MentionsData,
  MentionsPatch,
  MentionsQuery,
  MentionsService,
} from './mentions.class'

export type { Mentions, MentionsData, MentionsPatch, MentionsQuery }

export type MentionsClientService = Pick<
  MentionsService<Params<MentionsQuery>>,
  (typeof mentionsMethods)[number]
>

export const mentionsPath = 'mentions'

export const mentionsMethods: Array<keyof MentionsService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
]

export const mentionsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(mentionsPath, connection.service(mentionsPath), {
    methods: mentionsMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [mentionsPath]: MentionsClientService
  }
}
