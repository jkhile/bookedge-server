// src/utils/error-handler.ts
import { FeathersError, NotFound } from '@feathersjs/errors'
import { FeathersKoaContext } from '@feathersjs/koa'
import { logger } from '../logger'

export const errorHandler =
  // eslint-disable-next-line unicorn/consistent-function-scoping
  () => async (ctx: FeathersKoaContext, next: () => Promise<any>) => {
    try {
      await next()

      if (ctx.body === undefined) {
        throw new NotFound(`Path ${ctx.path} not found`)
      }
    } catch (error: any) {
      logger.error(error)
      ctx.response.status = error instanceof FeathersError ? error.code : 500
      ctx.body =
        typeof error.toJSON === 'function'
          ? error.toJSON()
          : {
              message: error.message,
            }
    }
  }
