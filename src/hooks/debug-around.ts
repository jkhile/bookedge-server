// src/hooks/debug-around.ts

import type { HookContext, NextFunction } from '@feathersjs/feathers'

/**
 * Display the current hook context for debugging.
 * @see https://hooks-common.feathersjs.com/hooks.html#debug
 */
export function debugAround<H extends HookContext = HookContext>(
  message: string,
  ...fieldNames: string[]
) {
  return async (context: H, next: NextFunction) => {
    console.debug(
      `* ${message || ''}\nbefore type:${context.type}, method: ${
        context.method
      }`,
    )
    if (context.data) {
      console.debug('data:', context.data)
    }
    if (context.params && context.params.query) {
      console.debug('query:', context.params.query)
    }
    if (context.result) {
      console.debug('result:', context.result)
    }

    const paramsBefore = context.params || {}
    console.debug('params props:', Object.keys(paramsBefore).sort())

    for (const fieldName of fieldNames) {
      console.debug(`params.${fieldName}:`, paramsBefore[fieldName])
    }

    if (context.error) {
      console.debug('error', context.error)
    }

    await next()

    console.debug(
      `* ${message || ''}\nafter type:${context.type}, method: ${
        context.method
      }`,
    )
    if (context.data) {
      console.debug('data:', context.data)
    }
    if (context.params && context.params.query) {
      console.debug('query:', context.params.query)
    }
    if (context.result) {
      console.debug('result:', context.result)
    }

    const paramsAfter = context.params || {}
    console.debug('params props:', Object.keys(paramsAfter).sort())

    for (const fieldName of fieldNames) {
      console.debug(`params.${fieldName}:`, paramsAfter[fieldName])
    }

    if (context.error) {
      console.debug('error', context.error)
    }
  }
}
