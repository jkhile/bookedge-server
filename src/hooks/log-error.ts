// For more information about this file see https://dove.feathersjs.com/guides/cli/log-error.html
import type { HookContext, NextFunction } from '../declarations'
import { logger } from '../logger'

export const logError = async (context: HookContext, next: NextFunction) => {
  logger.info('logError hook called')
  try {
    await next()
  } catch (error: any) {
    if (error.message.includes('uthenticated')) {
      logger.info(error.message)
    } else {
      logger.error(error.stack)
      if (error.data) {
        logger.error(`Error Data: ${JSON.stringify(error.data)}`)
      }
    }

    throw error
  }
}
;('NotAuthenticated: Not authenticated\n    at BookService.<anonymous> (/Users/johnhile/dev/bookedge/bookedge-server/node_modules/.pnpm/@feathersjs+authentication@5.0.29_typescript@5.5.3/node_modules/@feathersjs/authentication/lib/hooks/authenticate.js:44:19)\n    at BookService.dispatch (/Users/johnhile/dev/bookedge/bookedge-server/node_modules/.pnpm/@feathersjs+hooks@0.9.0/node_modules/@feathersjs/hooks/script/compose.js:30:43)\n    at BookService.logError (/Users/johnhile/dev/bookedge/bookedge-server/lib/hooks/log-error.js:7:15)\n    at BookService.dispatch (/Users/johnhile/dev/bookedge/bookedge-server/node_modules/.pnpm/@feathersjs+hooks@0.9.0/node_modules/@feathersjs/hooks/script/compose.js:30:43)\n    at BookService.logServiceCall (/Users/johnhile/dev/bookedge/bookedge-server/lib/hooks/log-service-call.js:30:11)\n    at BookService.dispatch (/Users/johnhile/dev/bookedge/bookedge-server/node_modules/.pnpm/@feathersjs+hooks@0.9.0/node_modules/@feathersjs/hooks/script/compose.js:30:43)\n    at BookService.eventHook (/Users/johnhile/dev/bookedge/bookedge-server/node_modules/.pnpm/@feathersjs+feathers@5.0.29/node_modules/@feathersjs/feathers/lib/events.js:11:12)\n    at BookService.dispatch (/Users/johnhile/dev/bookedge/bookedge-server/node_modules/.pnpm/@feathersjs+hooks@0.9.0/node_modules/@feathersjs/hooks/script/compose.js:30:43)\n    at BookService.hookChain (/Users/johnhile/dev/bookedge/bookedge-server/node_modules/.pnpm/@feathersjs+hooks@0.9.0/node_modules/@feathersjs/hooks/script/hooks.js:27:28)\n    at BookService.dispatch (/Users/johnhile/dev/bookedge/bookedge-server/node_modules/.pnpm/@feathersjs+hooks@0.9.0/node_modules/@feathersjs/hooks/script/compose.js:30:43)')
