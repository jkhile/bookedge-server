// test/services/users/user-permissions.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { restrictUserFields } from '../../../src/hooks/restrict-user-fields'
import { Forbidden } from '@feathersjs/errors'

describe('User Permissions Integration Tests', () => {
  // These tests are redundant with the hook-specific tests but are kept for clarity
  // In a real application, we would have full integration tests that test the actual API

  let context: any

  beforeEach(() => {
    // Set up a mock context for the hook
    context = {
      method: 'patch',
      id: 1,
      params: {
        user: {
          id: 1,
          roles: ['editor'],
        },
      },
      data: {},
    }
  })

  it('allows regular users to modify only their own email, name and password', async () => {
    context.data = {
      name: 'New Name',
      email: 'new.email@example.com',
      password: 'newpassword',
    }

    const result = await restrictUserFields(context)
    expect(result).toBe(context)
  })

  it('prevents regular users from modifying their roles', async () => {
    context.data = {
      name: 'New Name',
      roles: ['editor', 'admin'], // Trying to give themselves admin role
    }

    await expect(restrictUserFields(context)).rejects.toThrow(Forbidden)
  })

  it('prevents regular users from modifying their status', async () => {
    context.data = {
      name: 'New Name',
      status: 'archived', // Trying to change status
    }

    await expect(restrictUserFields(context)).rejects.toThrow(Forbidden)
  })

  it('prevents regular users from modifying their allowed_imprints', async () => {
    context.data = {
      name: 'New Name',
      allowed_imprints: [1, 2, 3], // Trying to change allowed imprints
    }

    await expect(restrictUserFields(context)).rejects.toThrow(Forbidden)
  })

  it('prevents regular users from modifying other users', async () => {
    context.id = 2 // Different from the logged-in user
    context.data = {
      name: 'Updated Name',
    }

    await expect(restrictUserFields(context)).rejects.toThrow(Forbidden)
  })
})
