// src/hooks/add-refresh-token.ts
import type { HookContext } from '../declarations'
import { v4 as uuidv4 } from 'uuid'
import { addDays } from 'date-fns'
import { logger } from '../logger'

/**
 * Configuration options for refresh token generation
 */
interface RefreshTokenConfig {
  secret: string
  expiresIn: string
}

/**
 * Access token configuration options
 */
interface JwtOptions {
  expiresIn: string
  [key: string]: unknown
}

/**
 * Authentication result with refresh token data
 */
interface AuthResult {
  user: { id: number }
  accessToken?: string
  refreshToken?: string
  refreshTokenExpires?: string
  accessTokenExpires?: string
}

/**
 * Extended authentication configuration that includes refresh token
 */
interface AuthenticationConfig {
  entity?: string
  service?: string
  secret: string
  authStrategies: string[]
  jwtOptions?: JwtOptions
  refreshToken?: RefreshTokenConfig
  [key: string]: unknown
}

/**
 * Generates and stores a refresh token when a user successfully authenticates
 *
 * This hook should be used as an after hook on the authentication service.
 * It will:
 * 1. Generate a unique refresh token
 * 2. Store it in the database with user ID and expiration
 * 3. Add the token and expiration info to the authentication result
 */
export const addRefreshToken = async (
  context: HookContext,
): Promise<HookContext> => {
  const { result } = context

  // Only proceed if authentication was successful and a user exists
  if (!result?.user) {
    console.log(
      'add-refresh-token - No user in result, skipping token creation',
    )
    return context
  }

  const { app } = context
  const userId = result.user.id

  // Get refresh token configuration from app settings
  const authConfig = app.get('authentication') as AuthenticationConfig
  if (!authConfig?.refreshToken) {
    console.log('No refreshToken configuration found')
    return context
  }

  const refreshTokenConfig = authConfig.refreshToken

  try {
    // Parse expiration days from config (default to 30 if not specified or invalid)
    const expirationDays = parseInt(refreshTokenConfig.expiresIn) || 30
    const expiresAt = addDays(new Date(), expirationDays).toISOString()

    // Generate a cryptographically secure unique token
    const tokenValue = uuidv4()

    // Remove any existing refresh tokens for this user before creating a new one
    // This ensures only one refresh token per user
    logger.info(`Removing existing refresh tokens for user ${userId}`)
    const existingTokens = await app.service('refresh-token').find({
      query: {
        userId,
      },
      paginate: false,
    })

    const tokensToDelete = Array.isArray(existingTokens)
      ? existingTokens
      : (existingTokens as any).data || []

    // Delete all existing tokens for this user
    for (const token of tokensToDelete) {
      await app.service('refresh-token').remove(token.id)
    }

    // Store the new token in the database
    await app.service('refresh-token').create({
      userId,
      token: tokenValue,
      expiresAt,
    })

    // Add refresh token data to authentication result directly as enumerable properties
    const authResult = result as AuthResult
    Object.defineProperties(authResult, {
      refreshToken: {
        value: tokenValue,
        enumerable: true,
        configurable: true,
        writable: true,
      },
      refreshTokenExpires: {
        value: expiresAt,
        enumerable: true,
        configurable: true,
        writable: true,
      },
    })

    // Add access token expiration information if available
    if (authResult.accessToken) {
      const jwtOptions = authConfig.jwtOptions
      if (jwtOptions?.expiresIn) {
        // Parse expiration time (assuming it's in seconds)
        const expiresInSeconds =
          typeof jwtOptions.expiresIn === 'string'
            ? parseInt(jwtOptions.expiresIn)
            : (jwtOptions.expiresIn as number)

        if (!isNaN(expiresInSeconds)) {
          const accessTokenExpiry = new Date(
            Date.now() + expiresInSeconds * 1000,
          ).toISOString()

          Object.defineProperty(authResult, 'accessTokenExpires', {
            value: accessTokenExpiry,
            enumerable: true,
            configurable: true,
            writable: true,
          })
        }
      }
    }
  } catch (error) {
    // Log error but don't fail authentication if refresh token creation fails
    logger.error('Error creating refresh token:', error)
  }

  return context
}
