// src/hooks/measure-performance.ts
import type { HookContext, NextFunction } from '../declarations'
import { logger } from '../logger'

/**
 * Hook to measure the duration of service calls and log those that exceed a minimum threshold.
 * @param options Configuration options for performance logging
 * @returns A hook function
 */
export interface MeasurePerformanceOptions {
  /** Minimum duration in milliseconds to trigger logging (default: 100) */
  minDuration?: number
  /** Whether to include the service method in the log (default: true) */
  logMethod?: boolean
  /** Whether to include the service path in the log (default: true) */
  logPath?: boolean
  /** Whether to include the service id in the log (default: true) */
  logId?: boolean
  /** Whether to include the query parameters in the log (default: false) */
  logQuery?: boolean
}

export const measurePerformance = (options: MeasurePerformanceOptions = {}) => {
  const {
    minDuration = 0,
    logMethod = true,
    logPath = true,
    logId = true,
    logQuery = true,
  } = options

  return async (context: HookContext, next: NextFunction) => {
    // Record start time
    const startTime = Date.now()

    // Continue with the service call
    await next()

    // Calculate duration
    const duration = Date.now() - startTime

    // Only log if duration exceeds minimum threshold
    if (duration >= minDuration) {
      const logParts = ['Perf']

      logParts.push(`${duration}ms`)

      if (logPath && context.path) {
        logParts.push(`${context.path}`)
      }

      if (logMethod && context.method) {
        logParts.push(`.${context.method}`)
      }

      if (logId && context.id !== undefined) {
        logParts.push(`id: ${context.id}`)
      }

      if (logQuery && context.params?.query) {
        logParts.push(`query: ${JSON.stringify(context.params.query)}`)
      }

      logParts.push(`user: ${JSON.stringify(context.params.user?.id)}`)

      logger.info(logParts.join(' '))
    }
  }
}
