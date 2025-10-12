// For more information about this file see https://dove.feathersjs.com/guides/cli/service.test.html
import assert from 'assert'
import { app } from '../../../src/app'
import { beforeEach, afterEach, describe, it } from 'vitest'

describe('refresh-token service', () => {
  let testUser: any
  const testEmail = 'refresh-token-test@example.com'
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
        // First delete all refresh tokens for this user
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
          // Tokens might not exist, that's fine
        }

        // Then delete the user
        await app.service('users').remove(user.id)
      }
    } catch (error) {
      // User might not exist, that's fine
    }

    // Create a test user with all required fields
    testUser = await app.service('users').create({
      email: testEmail,
      password: testPassword,
      name: 'Test User',
      status: 'active',
      roles: ['editor'],
      allowed_imprints: [],
      allowed_books: [],
      pinned_books: [],
    })
  })

  it('registered the service', () => {
    const service = app.service('refresh-token')

    assert.ok(service, 'Registered the service')
  })

  it('maintains only one refresh token per user', async () => {
    // First authentication - should create a refresh token
    const firstAuth = await app.service('authentication').create({
      strategy: 'local',
      email: testEmail,
      password: testPassword,
    })

    assert.ok(firstAuth.refreshToken, 'First auth should have refresh token')

    // Get refresh tokens for this user
    const tokensAfterFirst = await app.service('refresh-token').find({
      query: { userId: testUser.id },
      paginate: false,
    })
    const firstTokens = Array.isArray(tokensAfterFirst)
      ? tokensAfterFirst
      : tokensAfterFirst.data || []

    assert.equal(
      firstTokens.length,
      1,
      'Should have exactly one refresh token after first login',
    )
    assert.equal(
      firstTokens[0].token,
      firstAuth.refreshToken,
      'Token should match',
    )

    // Second authentication - should remove old token and create new one
    const secondAuth = await app.service('authentication').create({
      strategy: 'local',
      email: testEmail,
      password: testPassword,
    })

    assert.ok(secondAuth.refreshToken, 'Second auth should have refresh token')
    assert.notEqual(
      secondAuth.refreshToken,
      firstAuth.refreshToken,
      'Second token should be different from first',
    )

    // Get refresh tokens for this user again
    const tokensAfterSecond = await app.service('refresh-token').find({
      query: { userId: testUser.id },
      paginate: false,
    })
    const secondTokens = Array.isArray(tokensAfterSecond)
      ? tokensAfterSecond
      : tokensAfterSecond.data || []

    assert.equal(
      secondTokens.length,
      1,
      'Should still have exactly one refresh token',
    )
    assert.equal(
      secondTokens[0].token,
      secondAuth.refreshToken,
      'Token should match second auth',
    )

    // Verify first token is gone
    const firstTokenExists = secondTokens.some(
      (t: any) => t.token === firstAuth.refreshToken,
    )
    assert.equal(firstTokenExists, false, 'First token should no longer exist')
  })

  it('removes all existing tokens before creating a new one', async () => {
    // Manually create multiple tokens for the user (simulating a bug or old behavior)
    await app.service('refresh-token').create({
      userId: testUser.id,
      token: 'old-token-1',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    })

    await app.service('refresh-token').create({
      userId: testUser.id,
      token: 'old-token-2',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    })

    await app.service('refresh-token').create({
      userId: testUser.id,
      token: 'old-token-3',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    })

    // Verify we have 3 tokens
    const tokensBefore = await app.service('refresh-token').find({
      query: { userId: testUser.id },
      paginate: false,
    })
    const beforeTokens = Array.isArray(tokensBefore)
      ? tokensBefore
      : tokensBefore.data || []
    assert.equal(
      beforeTokens.length,
      3,
      'Should have 3 tokens before authentication',
    )

    // Authenticate - should clean up all old tokens
    const auth = await app.service('authentication').create({
      strategy: 'local',
      email: testEmail,
      password: testPassword,
    })

    // Verify we now have only 1 token
    const tokensAfter = await app.service('refresh-token').find({
      query: { userId: testUser.id },
      paginate: false,
    })
    const afterTokens = Array.isArray(tokensAfter)
      ? tokensAfter
      : tokensAfter.data || []
    assert.equal(
      afterTokens.length,
      1,
      'Should have exactly 1 token after authentication',
    )
    assert.equal(
      afterTokens[0].token,
      auth.refreshToken,
      'Token should match auth response',
    )
  })

  // Clean up after tests
  afterEach(async () => {
    if (testUser) {
      try {
        await app.service('users').remove(testUser.id)
      } catch (error) {
        // User might already be removed
      }
    }
  })
})
