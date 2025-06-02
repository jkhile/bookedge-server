import { BadRequest } from '@feathersjs/errors'
import type { HookContext } from '../declarations'

// Simple in-memory rate limiting for log messages
// In production, consider using Redis for distributed rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_LOGS_PER_MINUTE = 60 // Limit to 60 log messages per minute per user

export const rateLimitLogs = async (context: HookContext) => {
  if (context.method !== 'create') {
    return context
  }

  const userId = context.params.user?.id
  if (!userId) {
    // If no user ID, skip rate limiting (shouldn't happen with authentication)
    return context
  }

  const now = Date.now()
  const userKey = `logs:${userId}`

  let userLimits = rateLimitMap.get(userKey)

  // Reset if window has passed
  if (!userLimits || now > userLimits.resetTime) {
    userLimits = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW,
    }
  }

  // Count log messages (handle both single and array)
  const logCount = Array.isArray(context.data) ? context.data.length : 1
  userLimits.count += logCount

  if (userLimits.count > MAX_LOGS_PER_MINUTE) {
    throw new BadRequest(
      'Rate limit exceeded for log messages. Please slow down.',
    )
  }

  rateLimitMap.set(userKey, userLimits)

  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    // 1% chance
    for (const [key, limits] of rateLimitMap.entries()) {
      if (now > limits.resetTime) {
        rateLimitMap.delete(key)
      }
    }
  }

  return context
}
