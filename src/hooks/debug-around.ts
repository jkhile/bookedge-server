/* eslint-disable sonarjs/cognitive-complexity */
// src/hooks/debug-around.ts
/* eslint-disable no-console */
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
    console.log(
      `* ${message || ''}\nbefore type:${context.type}, method: ${
        context.method
      }`,
    )
    if (context.data) {
      console.log('data:', context.data)
    }
    if (context.params && context.params.query) {
      console.log('query:', context.params.query)
    }
    if (context.result) {
      console.log('result:', context.result)
    }

    const paramsBefore = context.params || {}
    console.log('params props:', Object.keys(paramsBefore).sort())

    for (const fieldName of fieldNames) {
      console.log(`params.${fieldName}:`, paramsBefore[fieldName])
    }

    if (context.error) {
      console.log('error', context.error)
    }

    await next()

    console.log(
      `* ${message || ''}\nafter type:${context.type}, method: ${
        context.method
      }`,
    )
    if (context.data) {
      console.log('data:', context.data)
    }
    if (context.params && context.params.query) {
      console.log('query:', context.params.query)
    }
    if (context.result) {
      console.log('result:', context.result)
    }

    const paramsAfter = context.params || {}
    console.log('params props:', Object.keys(paramsAfter).sort())

    for (const fieldName of fieldNames) {
      console.log(`params.${fieldName}:`, paramsAfter[fieldName])
    }

    if (context.error) {
      console.log('error', context.error)
    }
  }
}
