// src/hooks/log-service-call.ts
import type { HookContext, NextFunction } from '../declarations'
import type { Params } from '@feathersjs/feathers'
import { pick, omit } from 'lodash'
import { logger } from '../logger'

const removeProperties = [
  'access_token',
  'accessToken',
  'refresh_token',
  'id_token',
  'password',
]

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
    simplifiedContext.data = context.data
    const { method, path, _type } = simplifiedContext
    logger.debug(
      `${_type || 'unknown'} ${method || 'unknown'} ${path || 'unknown'}`,
      {
        context: stringifyAndRemoveProperties(
          simplifiedContext,
          removeProperties,
        ),
      },
    )
  }
  await next()

  // AFTER:
  if (context.logThis) {
    simplifiedContext = pick(context, ['method', 'path', 'result'])
    simplifiedContext._type = 'after'
    const { method, path, _type } = simplifiedContext
    logger.debug(
      `${_type || 'unknown'} ${method || 'unknown'} ${path || 'unknown'} `,
      {
        context: stringifyAndRemoveProperties(
          simplifiedContext,
          removeProperties,
        ),
      },
    )
  }
}

function simplifyParams(params: Params): Params {
  return omit(params, ['authentication', 'connection', 'headers'])
}

function stringifyAndRemoveProperties(
  object: object,
  propNames: string[],
): string {
  const jsonString = JSON.stringify(object, undefined, 2)
  // Create a regular expression pattern to match the properties to remove
  const propPattern = new RegExp(
    `"(${propNames.join('|')})":\\s*"?[^"]*"?\\s*(?=,|}|])`,
    'g',
  )

  // Replace the matched properties with an empty string
  const updatedJsonString = jsonString.replace(propPattern, '')

  // Remove any trailing commas left after property removal
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  const cleanedJsonString = updatedJsonString.replace(/,(?=\s*[\]}])/g, '')
  console.log('cleanedJsonString:', cleanedJsonString)
  return cleanedJsonString
}
