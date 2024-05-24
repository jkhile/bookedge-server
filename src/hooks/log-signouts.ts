// src/hooks/log-signouts.ts

import type { HookContext } from '../declarations'
import { logger } from '../logger'

export function logSignoutsHook(): (
  context: HookContext,
) => Promise<HookContext> {
  return async (context: HookContext) => {
    const user = context.result?.user
    if (user) {
      logger.info(`signed out id ${user.id}, ${user.email}, ${user.name}`)
    }
    return context
  }
}
