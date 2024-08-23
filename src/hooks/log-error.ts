// For more information about this file see https://dove.feathersjs.com/guides/cli/log-error.html
import type { HookContext, NextFunction } from '../declarations'
import { logger } from '../logger'

export const logError = async (context: HookContext, next: NextFunction) => {
  try {
    await next()
  } catch (error: any) {
    if (error.message.includes('unauthenticated')) {
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
