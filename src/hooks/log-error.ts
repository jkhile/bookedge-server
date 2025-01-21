// For more information about this file see https://dove.feathersjs.com/guides/cli/log-error.html
import type { HookContext, NextFunction } from '../declarations'
import { logger } from '../logger'

export const logError = async (context: HookContext, next: NextFunction) => {
  try {
    await next()
  } catch (error: any) {
    console.log(
      'JSON.stringify(error, null, 2):',
      JSON.stringify(error, null, 2),
    )
    if (convertToInfo(error.message)) {
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

const convertToInfo = (errMessage: string): boolean => {
  const infoClues = ['NotAuthenticated', 'TokenExpiredError']
  const containsClue = infoClues.some((clue) => errMessage.includes(clue))
  return containsClue
}
