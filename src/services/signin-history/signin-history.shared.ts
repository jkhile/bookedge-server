// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  SigninHistory,
  SigninHistoryData,
  SigninHistoryPatch,
  SigninHistoryQuery,
  SigninHistoryService,
} from './signin-history.class'

export type {
  SigninHistory,
  SigninHistoryData,
  SigninHistoryPatch,
  SigninHistoryQuery,
}

export type SigninHistoryClientService = Pick<
  SigninHistoryService<Params<SigninHistoryQuery>>,
  (typeof signinHistoryMethods)[number]
>

export const signinHistoryPath = 'signin-history'

export const signinHistoryMethods: Array<keyof SigninHistoryService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
]

export const signinHistoryClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(signinHistoryPath, connection.service(signinHistoryPath), {
    methods: signinHistoryMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [signinHistoryPath]: SigninHistoryClientService
  }
}
