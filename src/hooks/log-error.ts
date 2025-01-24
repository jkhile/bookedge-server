// For more information about this file see https://dove.feathersjs.com/guides/cli/log-error.html
import type { HookContext, NextFunction } from '../declarations'
import { logger } from '../logger'

export const logError = async (context: HookContext, next: NextFunction) => {
  try {
    await next()
  } catch (error: any) {
    console.log('in logError, context:', context)
    console.log(
      'in logError, JSON.stringify(error, null, 2):',
      JSON.stringify(error, null, 2),
    )
    const userEmail = context.arguments[2].connection.user.email
    const logLevel = convertToInfo(error.message) ? 'info' : 'error'
    logger.log({
      level: logLevel,
      message: error.message,
      _meta: {
        user: userEmail,
        data: error.data,
        event: context.event,
      },
    })
    throw error
  }
}

const convertToInfo = (errMessage: string): boolean => {
  const infoClues = ['NotAuthenticated', 'TokenExpiredError']
  const containsClue = infoClues.some((clue) => errMessage.includes(clue))
  return containsClue
}
