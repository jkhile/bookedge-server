// src/hooks/log-service-call.ts
import type { HookContext, NextFunction } from '../declarations'
import type { Params } from '@feathersjs/feathers'
import { pick, omit, truncate } from 'lodash'
import { logger } from '../logger'

export const logServiceCall = async (
  context: HookContext,
  next: NextFunction,
) => {
  // BEFORE:
  context.logThis =
    context.path !== 'log-messages' &&
    process.env.DEBUG_SERVICES?.includes(context.path)
  let simplifiedContext: Partial<HookContext> = {}
  if (context.logThis) {
    simplifiedContext = pick(context, ['method', 'path', 'id'])
    simplifiedContext._type = 'before'
    simplifiedContext.params = simplifyParams(context.params)
    simplifiedContext.data = truncate(JSON.stringify(context.data), {
      length: 500,
    })

    const { method, path, _type } = simplifiedContext
    logger.debug(
      `${_type || 'unknown'} ${method || 'unknown'} ${path || 'unknown'}`,
      simplifiedContext,
    )
  }
  await next()

  // AFTER:
  if (context.logThis) {
    simplifiedContext = pick(context, ['method', 'path', 'result'])
    simplifiedContext._type = 'after'
    const { method, path, _type } = simplifiedContext
    logger.debug(
      `${_type || 'unknown'} ${method || 'unknown'} ${path || 'unknown'}`,
      simplifiedContext,
    )
  }
}

function simplifyParams(params: Params): Params {
  const simplified = omit(params, ['authentication', 'connection', 'headers'])
  delete simplified.user?.access_token
  delete simplified.user?.refresh_token
  return simplified
}
