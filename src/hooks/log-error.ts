// For more information about this file see https://dove.feathersjs.com/guides/cli/log-error.html
import type { HookContext, NextFunction } from '../declarations'
import { logger } from '../logger'

export const logError = async (context: HookContext, next: NextFunction) => {
  try {
    await next()
  } catch (error: any) {
    // Safely extract user email from various possible locations
    const userEmail = getUserEmail(context)

    const logLevel = isInfoLevel(error) ? 'info' : 'error'

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
 * Determines if an error should be logged at info level rather than error.
 * Client errors (4xx) are not server bugs — we log them quietly so they don't
 * trigger alerting noise. Server errors (5xx) and unclassified errors still
 * log at error level.
 */
function isInfoLevel(error: unknown): boolean {
  const e = error as { code?: number; name?: string; className?: string }
  // Any FeathersError with a 4xx code is a client problem, not a server bug
  if (typeof e?.code === 'number' && e.code >= 400 && e.code < 500) {
    return true
  }
  // Non-Feathers auth errors (e.g. jsonwebtoken) may not carry a code
  const clientErrorNames = [
    'NotAuthenticated',
    'TokenExpiredError',
    'JsonWebTokenError',
    'NotFound',
    'Forbidden',
  ]
  return clientErrorNames.some(
    (name) => e?.name === name || e?.className === name,
  )
}
