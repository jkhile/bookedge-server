// For more information about this file see https://dove.feathersjs.com/guides/cli/channels.html
import type { RealTimeConnection, Params } from '@feathersjs/feathers'
import type { AuthenticationResult } from '@feathersjs/authentication'
import '@feathersjs/transport-commons'
import type { Application, HookContext } from './declarations'
// import { logger } from './logger'

export const channels = (app: Application) => {
  // logger.warn(
  //   'Publishing all events to all authenticated users. See `channels.ts` and https://dove.feathersjs.com/api/channels.html for more information.',
  // )

  app.on('connection', (connection: RealTimeConnection) => {
    // On a new real-time connection, add it to the anonymous channel
    app.channel('anonymous').join(connection)
  })

  app.on(
    'login',
    (authResult: AuthenticationResult, { connection }: Params) => {
      // connection can be undefined if there is no
      // real-time connection, e.g. when logging in via REST
      if (connection) {
        // The connection is no longer anonymous, remove it
        app.channel('anonymous').leave(connection)

        // Add it to the authenticated user channel
        app.channel('authenticated').join(connection)
      }
    },
  )

  app.publish((data: any, context: HookContext) => {
    // Get the authenticated channel
    const channels = app.channel('authenticated')

    // No need to modify data if we're not sending user info
    if (
      !context.params.user ||
      (context.method !== 'patch' && context.method !== 'update')
    ) {
      return channels
    }

    // Create a new object with the user metadata
    // This is maintained for backwards compatibility with clients
    // that haven't been updated to use fk_updated_by yet
    // TODO: Remove this once all clients have been updated
    const dataWithUser = {
      ...data,
      _lastModifiedBy: {
        id: context.params.user.id,
        email: context.params.user.email,
      },
    }

    // Send the modified data to authenticated users
    return channels.send(dataWithUser)
  })
}
