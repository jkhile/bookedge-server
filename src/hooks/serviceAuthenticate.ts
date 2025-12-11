/**
 * Service-to-Service Authentication Hook
 *
 * Validates JWT tokens signed with the shared SERVICE_AUTH_SECRET
 * for inter-service communication (e.g., finutils calling bookedge).
 */
import { HookContext, NextFunction } from '@feathersjs/feathers'
import { NotAuthenticated, GeneralError } from '@feathersjs/errors'
import jwt from 'jsonwebtoken'

export type ServiceClient = 'finutils' | 'bookedge'

interface ServiceTokenPayload {
  iss: ServiceClient
  aud: ServiceClient
  iat: number
  exp: number
}

// Extend Feathers params to include service client
declare module '@feathersjs/feathers' {
  interface Params {
    serviceClient?: ServiceClient
  }
}

/**
 * Hook to require service-to-service authentication.
 * Use this on internal-only endpoints that should only be called by other services.
 */
export const serviceAuthenticate = () => {
  return async (context: HookContext, _next?: NextFunction) => {
    const next = typeof _next === 'function' ? _next : async () => context
    const { app, params } = context

    // Get service auth config
    const authConfig = app.get('authentication') as {
      serviceAuth?: { secret?: string; finutils_url?: string }
    }
    const serviceSecret = authConfig?.serviceAuth?.secret

    if (!serviceSecret) {
      throw new GeneralError('Service authentication not configured')
    }

    // Get authorization header from params (set by REST/socket middleware)
    const authHeader = params.headers?.authorization as string | undefined

    if (!authHeader?.startsWith('Bearer ')) {
      throw new NotAuthenticated('Missing service token')
    }

    const token = authHeader.slice(7)

    try {
      const payload = jwt.verify(token, serviceSecret, {
        audience: 'bookedge',
      }) as ServiceTokenPayload

      // Add service client to params for downstream use
      context.params.serviceClient = payload.iss
      context.params.authenticated = true

      return next()
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new NotAuthenticated('Service token expired')
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new NotAuthenticated('Invalid service token')
      }
      throw new NotAuthenticated('Service authentication failed')
    }
  }
}

/**
 * Creates a signed JWT for calling another service (e.g., finutils).
 * Token is short-lived (60 seconds) to minimize risk if compromised.
 */
export function createServiceToken(
  app: HookContext['app'],
  audience: Exclude<ServiceClient, 'bookedge'>,
): string {
  const authConfig = app.get('authentication') as {
    serviceAuth?: { secret?: string }
  }
  const serviceSecret = authConfig?.serviceAuth?.secret

  if (!serviceSecret) {
    throw new Error('SERVICE_AUTH_SECRET is not configured')
  }

  return jwt.sign({ iss: 'bookedge' as const, aud: audience }, serviceSecret, {
    expiresIn: '60s',
  })
}
