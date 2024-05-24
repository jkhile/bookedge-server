// src/hooks/log-authentication.ts

import type { HookContext, NextFunction } from '../declarations'
import { logger } from '../logger'

export function logAuthenticationHook(): (
  context: HookContext,
  next: NextFunction,
) => Promise<void> {
  return async (context: HookContext, next: NextFunction) => {
    // before.
    // save the authStrategy in context because it is not available in the after hook
    context.strategy = context.data.strategy

    await next()

    // after
    // log the authentication event
    const { strategy } = context
    const user = context.result?.user
    if (user) {
      logger.info(
        `${strategy} auth for id ${user.id}, ${user.email}, ${user.name}`,
      )
    }
  }
}
