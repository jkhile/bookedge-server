// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params, NullableId, Id } from '@feathersjs/feathers'
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'
import { NotAuthenticated } from '@feathersjs/errors'
import { AuthenticationService } from '@feathersjs/authentication'
import { addDays } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../../logger'

import type { Application } from '../../declarations'
import type {
  RefreshToken,
  RefreshTokenData,
  RefreshTokenPatch,
  RefreshTokenQuery,
} from './refresh-token.schema'

export type {
  RefreshToken,
  RefreshTokenData,
  RefreshTokenPatch,
  RefreshTokenQuery,
}

export interface RefreshTokenParams
  extends KnexAdapterParams<RefreshTokenQuery> {}

// Define the authentication config interface to help TypeScript
interface AuthConfig {
  entity?: string
  service?: string
  secret: string
  authStrategies: string[]
  jwtOptions?: {
    expiresIn?: string | number
  }
  refreshToken?: {
    secret: string
    expiresIn: string
  }
  [key: string]: unknown
}

// Extended refresh token response with authentication fields
export interface EnhancedRefreshToken extends RefreshToken {
  accessToken: string
  refreshToken: string
  refreshTokenExpires: string
  accessTokenExpires?: string
  user: any
}

// Extended service with token refresh using patch
export class RefreshTokenService<
  ServiceParams extends Params = RefreshTokenParams,
> extends KnexService<
  RefreshToken,
  RefreshTokenData,
  RefreshTokenParams,
  RefreshTokenPatch
> {
  app: Application

  constructor(options: KnexAdapterOptions & { app: Application }) {
    super(options)
    this.app = options.app
  }

  // Standard overrides to maintain type compatibility
  async patch(
    id: Id,
    data: RefreshTokenPatch,
    params?: ServiceParams,
  ): Promise<RefreshToken>
  async patch(
    id: null,
    data: RefreshTokenPatch,
    params?: ServiceParams,
  ): Promise<RefreshToken[]>
  async patch(
    id: NullableId,
    data: RefreshTokenPatch,
    params?: ServiceParams,
  ): Promise<RefreshToken | RefreshToken[]> {
    // Check if this is a token refresh request
    if (id === 'token' && data.token) {
      // We need to cast here because the refreshToken method returns an enhanced token
      return this.refreshToken(data.token) as unknown as RefreshToken
    }

    // If not a refresh request, perform normal patch operation
    return super.patch(id, data, params)
  }

  /**
   * Helper method for token refresh logic
   */
  private async refreshToken(
    refreshToken: string,
  ): Promise<EnhancedRefreshToken> {
    try {
      // Find the specific refresh token using FeathersJS service methods
      // Use super.find() to call the parent KnexService method directly
      const result = await super.find({
        query: {
          token: refreshToken,
        },
        paginate: false,
      })

      const tokenRecords = Array.isArray(result)
        ? result
        : (result as any).data || []

      if (!tokenRecords || tokenRecords.length === 0) {
        logger.error('In refreshToken, no refresh token found')
        throw new NotAuthenticated('Invalid refresh token')
      }

      // Should only be one record, but verify we have the exact match
      const tokenRecord = tokenRecords.find(
        (record: any) => record.token === refreshToken,
      )

      if (!tokenRecord) {
        logger.error('In refreshToken, Exact token match not found')
        throw new NotAuthenticated('Invalid refresh token')
      }

      // Check if the token has expired
      if (new Date(tokenRecord.expiresAt) < new Date()) {
        // Remove the expired token
        await super.remove(tokenRecord.id)
        throw new NotAuthenticated('Refresh token has expired')
      }

      // Get the user associated with this token
      const userId = tokenRecord.userId
      const userService = this.app.service('users')
      // Use internal service call (provider: undefined) to bypass authentication
      const user = await userService.get(userId, { provider: undefined })

      if (!user) {
        logger.error(`In refreshToken, User not found for ID: ${userId}`)
        throw new NotAuthenticated('User not found')
      }

      // Get the authentication service and configuration
      const authService = this.app.service(
        'authentication',
      ) as AuthenticationService
      const authConfig = this.app.get('authentication') as AuthConfig

      // Create a new JWT token for the user
      const payload = {
        sub: user.id.toString(),
        userId: user.id,
        iat: Math.floor(Date.now() / 1000),
      }

      // Generate the JWT token using the authentication service
      const accessToken = await authService.createAccessToken(payload)

      // Calculate access token expiration
      let accessTokenExpires: string | undefined
      if (authConfig.jwtOptions?.expiresIn) {
        const expiresInSeconds =
          typeof authConfig.jwtOptions.expiresIn === 'string'
            ? parseInt(authConfig.jwtOptions.expiresIn)
            : (authConfig.jwtOptions.expiresIn as number)

        if (!isNaN(expiresInSeconds)) {
          accessTokenExpires = new Date(
            Date.now() + expiresInSeconds * 1000,
          ).toISOString()
        }
      }

      // Check if token is close to expiration and regenerate if needed
      const oneWeekFromNow = addDays(new Date(), 7)
      let updatedRefreshToken = refreshToken
      let updatedExpiresAt = tokenRecord.expiresAt

      if (new Date(tokenRecord.expiresAt) < oneWeekFromNow) {
        // Get refresh token config
        const refreshTokenConfig = authConfig.refreshToken

        if (refreshTokenConfig) {
          // Generate a new token
          updatedRefreshToken = uuidv4()

          // Parse expiration days from config (default to 30 if not specified or invalid)
          const expirationDays = parseInt(refreshTokenConfig.expiresIn) || 30
          updatedExpiresAt = addDays(new Date(), expirationDays).toISOString()

          // Update the token record with new token and expiration
          await super.patch(tokenRecord.id, {
            token: updatedRefreshToken,
            expiresAt: updatedExpiresAt,
          })
        }
      }

      // Add authentication fields to the token record for the response
      const enhancedResponse: EnhancedRefreshToken = {
        ...tokenRecord,
        token: updatedRefreshToken,
        expiresAt: updatedExpiresAt,
        accessToken,
        refreshToken: updatedRefreshToken,
        refreshTokenExpires: updatedExpiresAt,
        accessTokenExpires,
        user,
      }

      return enhancedResponse
    } catch (error) {
      logger.error('Error refreshing token:', error)
      throw error
    }
  }
}

export const getOptions = (
  app: Application,
): KnexAdapterOptions & { app: Application } => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'refresh-token',
    app,
  }
}
