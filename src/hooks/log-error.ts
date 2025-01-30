// For more information about this file see https://dove.feathersjs.com/guides/cli/log-error.html
import type { HookContext, NextFunction } from '../declarations'
import { logger } from '../logger'

export const logError = async (context: HookContext, next: NextFunction) => {
  try {
    await next()
  } catch (error: any) {
    // Safely extract user email from various possible locations
    const userEmail = getUserEmail(context)

    const logLevel = isInfoLevel(error.message) ? 'info' : 'error'

    // Construct metadata safely
    const metadata = {
      user: userEmail,
      path: context.path,
      method: context.method,
      type: context.type,
      ...(error.data && { data: error.data }),
      ...(context.event && { event: context.event }),
    }

    // Log the error with structured metadata
    logger.log({
      level: logLevel,
      message: error.message,
      _meta: metadata,
      ...(error.stack && { stack: error.stack }),
    })

    throw error
  }
}

/**
 * Safely extracts user email from the context, checking multiple possible locations
 */
function getUserEmail(context: HookContext): string | undefined {
  try {
    // Check params.user first (most reliable)
    if (context.params?.user?.email) {
      return context.params.user.email
    }

    // Check connection user if available
    if (context.params?.connection?.user?.email) {
      return context.params.connection.user.email
    }

    // Check arguments if they exist (least reliable)
    const connectionArg = context.arguments?.[2]
    if (connectionArg?.connection?.user?.email) {
      return connectionArg.connection.user.email
    }

    return undefined
  } catch (error: any) {
    // If anything goes wrong extracting the email, return undefined
    // rather than throwing an error
    console.info('error getting user email in logError:', error)
    return undefined
  }
}

/**
 * Determines if an error message should be logged at info level
 */
function isInfoLevel(errMessage: string): boolean {
  const infoPatterns = [
    'NotAuthenticated',
    'TokenExpiredError',
    'NotFound',
    'Forbidden',
    'jwt expired',
  ]
  return infoPatterns.some((pattern) => errMessage.includes(pattern))
}
