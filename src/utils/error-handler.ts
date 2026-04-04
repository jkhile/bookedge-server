// src/utils/error-handler.ts
//
import { FeathersError, NotFound } from '@feathersjs/errors'
import { FeathersKoaContext } from '@feathersjs/koa'
import { logger } from '../logger'

export const errorHandler =
  () => async (ctx: FeathersKoaContext, next: () => Promise<any>) => {
    try {
      await next()

      if (ctx.body === undefined) {
        throw new NotFound(`Path ${ctx.path} not found`)
      }
    } catch (error: any) {
      // 4xx are client errors, not server bugs — log quietly so they don't
      // trigger alerting noise. 5xx and unclassified errors log at error.
      const code = error instanceof FeathersError ? error.code : 500
      if (code >= 400 && code < 500) {
        logger.info(error.message, { code, name: error.name })
      } else {
        logger.error(error)
      }
      ctx.response.status = code
      ctx.body =
        typeof error.toJSON === 'function'
          ? error.toJSON()
          : {
              message: error.message,
            }
    }
  }
