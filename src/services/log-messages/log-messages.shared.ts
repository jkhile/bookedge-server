// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { ClientApplication } from '../../client'
import type { LogMessageData, LogMessageService } from './log-messages.class'

export type { LogMessageData }

export type LogMessageClientService = Pick<
  LogMessageService,
  (typeof logMessageMethods)[number]
>

export const logMessagePath = 'log-messages'

export const logMessageMethods = ['create'] as const

export const logMessageClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(logMessagePath, connection.service(logMessagePath), {
    methods: logMessageMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [logMessagePath]: LogMessageClientService
  }
}
