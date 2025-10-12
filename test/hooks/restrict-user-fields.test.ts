// test/hooks/restrict-user-fields.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { restrictUserFields } from '../../src/hooks/restrict-user-fields'
import { Forbidden } from '@feathersjs/errors'

describe('restrictUserFields hook', () => {
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
        provider: 'rest', // Simulate an external request
      },
      data: {},
    }
  })

  it('allows admin users to modify any field', async () => {
    context.params.user.roles = ['admin']
    context.data = {
      name: 'New Name',
      roles: ['editor', 'author'],
      status: 'archived',
    }

    const result = await restrictUserFields(context)

    // Should pass through without error
    expect(result).toBe(context)
    expect(result.data).toEqual({
      name: 'New Name',
      roles: ['editor', 'author'],
      status: 'archived',
    })
  })

  it('allows non-admin users to modify allowed fields', async () => {
    context.data = {
      name: 'New Name',
      email: 'new.email@example.com',
      password: 'newpassword',
    }

    const result = await restrictUserFields(context)

    // Should pass through without error
    expect(result).toBe(context)
    expect(result.data).toEqual({
      name: 'New Name',
      email: 'new.email@example.com',
      password: 'newpassword',
    })
  })

  it('prevents non-admin users from modifying disallowed fields', async () => {
    context.data = {
      name: 'New Name',
      roles: ['editor', 'author'],
    }

    // Should throw Forbidden error
    await expect(restrictUserFields(context)).rejects.toThrow(Forbidden)
  })

  it('prevents non-admin users from modifying other users', async () => {
    context.id = 2 // Different from the logged-in user
    context.data = {
      name: 'New Name',
    }

    // Should throw Forbidden error
    await expect(restrictUserFields(context)).rejects.toThrow(Forbidden)
  })

  it('allows operations that are not patch or update', async () => {
    context.method = 'get'
    context.data = {
      roles: ['editor', 'author'],
    }

    const result = await restrictUserFields(context)

    // Should pass through without error
    expect(result).toBe(context)
  })

  it('allows internal calls to modify any field', async () => {
    // Remove user to simulate an internal call
    delete context.params.user

    context.data = {
      name: 'New Name',
      roles: ['editor', 'author'],
      file_storage_id: 'some-file-id',
    }

    const result = await restrictUserFields(context)

    // Should pass through without error
    expect(result).toBe(context)
    expect(result.data).toEqual({
      name: 'New Name',
      roles: ['editor', 'author'],
      file_storage_id: 'some-file-id',
    })
  })

  it('allows internal calls to modify other user records', async () => {
    // Remove user to simulate an internal call
    delete context.params.user

    // Different user ID
    context.id = 999

    context.data = {
      file_storage_id: 'some-file-id',
    }

    const result = await restrictUserFields(context)

    // Should pass through without error
    expect(result).toBe(context)
    expect(result.data).toEqual({
      file_storage_id: 'some-file-id',
    })
  })
})
