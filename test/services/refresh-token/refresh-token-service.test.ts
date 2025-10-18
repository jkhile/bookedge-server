import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { app } from '../../../src/app'
import { NotAuthenticated } from '@feathersjs/errors'

describe('RefreshTokenService class methods', () => {
  let testUser: any
  const testEmail = 'refresh-service-test@example.com'
  const testPassword = 'testpassword123'

  beforeEach(async () => {
    // Clean up any existing test user and their tokens
    try {
      const existingUsers = await app.service('users').find({
        query: { email: testEmail },
        paginate: false,
      })
      const users = Array.isArray(existingUsers)
        ? existingUsers
        : existingUsers.data || []

      for (const user of users) {
        try {
          const tokens = await app.service('refresh-token').find({
            query: { userId: user.id },
            paginate: false,
          })
          const tokenList = Array.isArray(tokens) ? tokens : tokens.data || []
          for (const token of tokenList) {
            await app.service('refresh-token').remove(token.id)
          }
        } catch (error) {
          // Tokens might not exist
        }
        await app.service('users').remove(user.id)
      }
    } catch (error) {
      // User might not exist
    }

    // Create a test user
    testUser = await app.service('users').create({
      email: testEmail,
      password: testPassword,
      name: 'Refresh Service Test User',
      status: 'active',
      roles: ['editor'],
      allowed_imprints: [],
      allowed_books: [],
      pinned_books: [],
    })
  })

  afterEach(async () => {
    if (testUser) {
      try {
        await app.service('users').remove(testUser.id)
      } catch (error) {
        // User might already be removed
      }
    }
  })

  describe('patch method with token refresh', () => {
    it('should refresh token when patching with id="token"', async () => {
      // First authenticate to get a refresh token
      const authResult = await app.service('authentication').create({
        strategy: 'local',
        email: testEmail,
        password: testPassword,
      })

      const originalRefreshToken = authResult.refreshToken

      // Use the patch method to refresh the token
      const refreshResult = await app.service('refresh-token').patch('token', {
        token: originalRefreshToken,
      })

      expect(refreshResult).toBeDefined()
      expect((refreshResult as any).accessToken).toBeDefined()
      expect((refreshResult as any).refreshToken).toBeDefined()
      expect((refreshResult as any).user).toBeDefined()
      expect((refreshResult as any).user.email).toBe(testEmail)
    })

    it('should return new access token when refreshing', async () => {
      const authResult = await app.service('authentication').create({
        strategy: 'local',
        email: testEmail,
        password: testPassword,
      })

      const refreshResult = await app.service('refresh-token').patch('token', {
        token: authResult.refreshToken,
      })

      expect((refreshResult as any).accessToken).toBeDefined()
      expect((refreshResult as any).accessToken).not.toBe(
        authResult.accessToken,
      )
    })

    it('should include user data in refresh response', async () => {
      const authResult = await app.service('authentication').create({
        strategy: 'local',
        email: testEmail,
        password: testPassword,
      })

      const refreshResult = await app.service('refresh-token').patch('token', {
        token: authResult.refreshToken,
      })

      const user = (refreshResult as any).user
      expect(user).toBeDefined()
      expect(user.id).toBe(testUser.id)
      expect(user.email).toBe(testEmail)
      expect(user.name).toBe('Refresh Service Test User')
      // User object structure verification (password handling varies by hooks)
    })

    it('should perform normal patch when id is not "token"', async () => {
      // Create a refresh token directly
      const tokenRecord = await app.service('refresh-token').create({
        userId: testUser.id,
        token: 'test-token-123',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      })

      // Perform normal patch with numeric id
      const patchResult = await app
        .service('refresh-token')
        .patch(tokenRecord.id, {
          token: 'updated-token-456',
        })

      expect(patchResult.token).toBe('updated-token-456')
      expect((patchResult as any).accessToken).toBeUndefined() // Should not have auth fields
    })
  })

  describe('refreshToken method error handling', () => {
    it('should throw NotAuthenticated for invalid refresh token', async () => {
      await expect(
        app.service('refresh-token').patch('token', {
          token: 'invalid-token-does-not-exist',
        }),
      ).rejects.toThrow(NotAuthenticated)
    })

    it('should throw NotAuthenticated for expired refresh token', async () => {
      // Create an expired token
      const expiredToken = await app.service('refresh-token').create({
        userId: testUser.id,
        token: 'expired-token-123',
        expiresAt: new Date(Date.now() - 86400000).toISOString(), // Expired yesterday
      })

      await expect(
        app.service('refresh-token').patch('token', {
          token: expiredToken.token,
        }),
      ).rejects.toThrow(NotAuthenticated)

      // Verify the expired token was removed
      const tokens = await app.service('refresh-token').find({
        query: { token: 'expired-token-123' },
        paginate: false,
      })
      const tokenList = Array.isArray(tokens) ? tokens : tokens.data || []
      expect(tokenList.length).toBe(0)
    })

    it('should throw error when token deleted', async () => {
      // Test that the service properly handles when a token is deleted
      // Create a temporary token directly and then delete it

      const tempToken = await app.service('refresh-token').create({
        userId: testUser.id,
        token: `temp-token-${Date.now()}`,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      })

      // Delete the token
      await app.service('refresh-token').remove(tempToken.id)

      // Now trying to refresh with this token should fail
      await expect(
        app.service('refresh-token').patch('token', {
          token: tempToken.token,
        }),
      ).rejects.toThrow()
    })
  })

  describe('refresh token regeneration', () => {
    it('should handle refresh token near expiration', async () => {
      // Create a token that expires in 5 days (less than 7 days threshold)
      const fiveDaysFromNow = Date.now() + 5 * 24 * 60 * 60 * 1000
      const expiringToken = await app.service('refresh-token').create({
        userId: testUser.id,
        token: 'expiring-soon-token',
        expiresAt: new Date(fiveDaysFromNow).toISOString(),
      })

      const originalExpirationTime = new Date(expiringToken.expiresAt).getTime()

      const refreshResult = await app.service('refresh-token').patch('token', {
        token: expiringToken.token,
      })

      const newToken = (refreshResult as any).refreshToken
      const newRefreshTokenExpires = (refreshResult as any).refreshTokenExpires

      // Token should be defined
      expect(newToken).toBeDefined()
      expect(newRefreshTokenExpires).toBeDefined()

      // Verify the token was updated/maintained in the database
      const updatedTokens = await app.service('refresh-token').find({
        query: { userId: testUser.id },
        paginate: false,
      })
      const tokenList = Array.isArray(updatedTokens)
        ? updatedTokens
        : updatedTokens.data || []

      expect(tokenList.length).toBe(1)

      // Verify we got a valid refresh response
      expect((refreshResult as any).accessToken).toBeDefined()
      expect((refreshResult as any).user).toBeDefined()
      expect((refreshResult as any).user.id).toBe(testUser.id)
    })

    it('should not regenerate refresh token when not close to expiration', async () => {
      // Create a token that expires in 20 days (more than 7 days threshold)
      const validToken = await app.service('refresh-token').create({
        userId: testUser.id,
        token: 'valid-token-123',
        expiresAt: new Date(
          Date.now() + 20 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      })

      const originalExpiration = validToken.expiresAt

      const refreshResult = await app.service('refresh-token').patch('token', {
        token: validToken.token,
      })

      // Should keep the same token
      expect((refreshResult as any).refreshToken).toBe(validToken.token)
      // Expiration dates should match (allow for ISO string comparison)
      expect((refreshResult as any).refreshTokenExpires).toEqual(
        originalExpiration,
      )
    })
  })

  describe('access token expiration', () => {
    it('should include accessTokenExpires when JWT expiration is configured', async () => {
      const authResult = await app.service('authentication').create({
        strategy: 'local',
        email: testEmail,
        password: testPassword,
      })

      const refreshResult = await app.service('refresh-token').patch('token', {
        token: authResult.refreshToken,
      })

      // The accessTokenExpires should be set based on JWT config
      expect((refreshResult as any).accessTokenExpires).toBeDefined()

      // Should be a valid ISO date string
      const expiresDate = new Date((refreshResult as any).accessTokenExpires)
      expect(expiresDate.getTime()).toBeGreaterThan(Date.now())
    })

    it('should calculate correct access token expiration time', async () => {
      const authResult = await app.service('authentication').create({
        strategy: 'local',
        email: testEmail,
        password: testPassword,
      })

      const refreshResult = await app.service('refresh-token').patch('token', {
        token: authResult.refreshToken,
      })

      const accessTokenExpires = (refreshResult as any).accessTokenExpires
      const expiresDate = new Date(accessTokenExpires)
      const now = new Date()

      // Should expire in the future (within reasonable range)
      const diffInMinutes = (expiresDate.getTime() - now.getTime()) / 1000 / 60
      expect(diffInMinutes).toBeGreaterThan(0)
      expect(diffInMinutes).toBeLessThan(60 * 24) // Less than 24 hours
    })
  })

  describe('enhanced refresh token response', () => {
    it('should return all required fields in enhanced response', async () => {
      const authResult = await app.service('authentication').create({
        strategy: 'local',
        email: testEmail,
        password: testPassword,
      })

      const refreshResult: any = await app
        .service('refresh-token')
        .patch('token', {
          token: authResult.refreshToken,
        })

      // Check all fields from EnhancedRefreshToken interface
      expect(refreshResult.id).toBeDefined()
      expect(refreshResult.userId).toBe(testUser.id)
      expect(refreshResult.token).toBeDefined()
      expect(refreshResult.expiresAt).toBeDefined()
      expect(refreshResult.accessToken).toBeDefined()
      expect(refreshResult.refreshToken).toBeDefined()
      expect(refreshResult.refreshTokenExpires).toBeDefined()
      expect(refreshResult.user).toBeDefined()
    })

    it('should maintain token record fields in response', async () => {
      const authResult = await app.service('authentication').create({
        strategy: 'local',
        email: testEmail,
        password: testPassword,
      })

      const refreshResult: any = await app
        .service('refresh-token')
        .patch('token', {
          token: authResult.refreshToken,
        })

      // Original token record fields should be present
      expect(refreshResult.userId).toBe(testUser.id)
      expect(refreshResult.createdAt).toBeDefined()
      expect(refreshResult.updatedAt).toBeDefined()
    })
  })

  describe('multiple token refresh scenarios', () => {
    it('should handle rapid successive token refreshes', async () => {
      const authResult = await app.service('authentication').create({
        strategy: 'local',
        email: testEmail,
        password: testPassword,
      })

      let currentToken = authResult.refreshToken

      // Refresh token multiple times
      for (let i = 0; i < 3; i++) {
        const refreshResult: any = await app
          .service('refresh-token')
          .patch('token', {
            token: currentToken,
          })

        expect(refreshResult.accessToken).toBeDefined()
        expect(refreshResult.user.id).toBe(testUser.id)

        // Update to the potentially new token
        currentToken = refreshResult.refreshToken
      }

      // Should still have only one token in database
      const tokens = await app.service('refresh-token').find({
        query: { userId: testUser.id },
        paginate: false,
      })
      const tokenList = Array.isArray(tokens) ? tokens : tokens.data || []
      expect(tokenList.length).toBe(1)
    })

    it('should handle concurrent refresh requests with same token', async () => {
      const authResult = await app.service('authentication').create({
        strategy: 'local',
        email: testEmail,
        password: testPassword,
      })

      // Make multiple concurrent refresh requests
      const promises = [
        app.service('refresh-token').patch('token', {
          token: authResult.refreshToken,
        }),
        app.service('refresh-token').patch('token', {
          token: authResult.refreshToken,
        }),
        app.service('refresh-token').patch('token', {
          token: authResult.refreshToken,
        }),
      ]

      const results = await Promise.all(promises)

      // All should succeed
      results.forEach((result: any) => {
        expect(result.accessToken).toBeDefined()
        expect(result.user.id).toBe(testUser.id)
      })
    })
  })
})
