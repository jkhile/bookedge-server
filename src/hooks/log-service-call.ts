// src/hooks/log-service-call.ts
import type { HookContext, NextFunction } from '../declarations'
import type { Params } from '@feathersjs/feathers'
import { pick, omit, truncate } from 'lodash'
import { logger } from '../logger'

export const logServiceCall = async (
  context: HookContext,
  next: NextFunction,
) => {
  let simplifiedContext: Partial<HookContext> = {}
  // BEFORE:
  if (context.path !== 'log-messages') {
    simplifiedContext = pick(context, ['method', 'path', 'id'])
    simplifiedContext._type = 'before'
    simplifiedContext.params = simplifyParams(context.params)
    simplifiedContext.data = truncate(JSON.stringify(context.data), {
      length: 500,
    })

    // logger.debug(JSON.stringify(simplifiedContext))
    const { method, path, _type } = simplifiedContext
    logger.debug(
      `${_type || 'unknown'} ${method || 'unknown'} ${path || 'unknown'}`,
      simplifiedContext,
    )
  }
  await next()

  // AFTER:
  if (context.path !== 'log-messages') {
    simplifiedContext = pick(context, ['method', 'path', 'result'])
    simplifiedContext._type = 'after'
    // logger.debug(JSON.stringify(simplifiedContext))
    const { method, path, _type } = simplifiedContext
    logger.debug(
      `${_type || 'unknown'} ${method || 'unknown'} ${path || 'unknown'}`,
      simplifiedContext,
    )
  }
}

function simplifyParams(params: Params): Params {
  return omit(params, ['authentication', 'connection', 'headers'])
}
