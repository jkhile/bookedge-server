import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { GoogleDriveManager } from '../../src/utils/google-drive-manager'
import { GoogleDriveClient } from '../../src/utils/google-drive-client'
import { GeneralError } from '@feathersjs/errors'
import type { Application } from '../../src/declarations'

// Mock the dependencies
vi.mock('../../src/utils/google-drive-client')
vi.mock('../../src/logger')

describe('GoogleDriveManager', () => {
  let app: Application
  let manager: GoogleDriveManager
  let mockClient: GoogleDriveClient

  beforeEach(() => {
    vi.clearAllMocks()

    // Create a mock application
    app = {} as Application

    // Create mock client
    mockClient = {
      uploadFile: vi.fn(),
      downloadFile: vi.fn(),
      createFolder: vi.fn(),
    } as any

    // Reset singleton instance
    ;(GoogleDriveManager as any).instance = undefined

    // Get fresh instance
    manager = GoogleDriveManager.getInstance(app)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = GoogleDriveManager.getInstance(app)
      const instance2 = GoogleDriveManager.getInstance(app)

      expect(instance1).toBe(instance2)
    })

    it('should create new instance if not exists', () => {
      expect(manager).toBeInstanceOf(GoogleDriveManager)
    })
  })

  describe('getServiceAccountClient', () => {
    it('should create and cache service account client', async () => {
      vi.mocked(GoogleDriveClient.createServiceAccountClient).mockResolvedValue(
        mockClient,
      )

      const client1 = await manager.getServiceAccountClient()
      const client2 = await manager.getServiceAccountClient()

      expect(client1).toBe(mockClient)
      expect(client2).toBe(mockClient)
      expect(
        GoogleDriveClient.createServiceAccountClient,
      ).toHaveBeenCalledTimes(1)
    })

    it('should throw GeneralError when client creation fails', async () => {
      vi.mocked(GoogleDriveClient.createServiceAccountClient).mockRejectedValue(
        new Error('Auth failed'),
      )

      await expect(manager.getServiceAccountClient()).rejects.toThrow(
        GeneralError,
      )
    })

    it('should reuse existing client on subsequent calls', async () => {
      vi.mocked(GoogleDriveClient.createServiceAccountClient).mockResolvedValue(
        mockClient,
      )

      await manager.getServiceAccountClient()
      await manager.getServiceAccountClient()
      await manager.getServiceAccountClient()

      expect(
        GoogleDriveClient.createServiceAccountClient,
      ).toHaveBeenCalledTimes(1)
    })
  })

  describe('getUserClient', () => {
    it('should create user client with access token', async () => {
      vi.mocked(GoogleDriveClient.createUserClient).mockResolvedValue(
        mockClient,
      )

      const client = await manager.getUserClient('user-123', 'token-123')

      expect(client).toBe(mockClient)
      expect(GoogleDriveClient.createUserClient).toHaveBeenCalledWith(
        'token-123',
      )
    })

    it('should cache user client', async () => {
      vi.mocked(GoogleDriveClient.createUserClient).mockResolvedValue(
        mockClient,
      )

      const client1 = await manager.getUserClient('user-123', 'token-123')
      const client2 = await manager.getUserClient('user-123', 'token-456')

      expect(client1).toBe(mockClient)
      expect(client2).toBe(mockClient)
      expect(GoogleDriveClient.createUserClient).toHaveBeenCalledTimes(1)
    })

    it('should create new client for different users', async () => {
      const mockClient2 = { ...mockClient } as any

      vi.mocked(GoogleDriveClient.createUserClient)
        .mockResolvedValueOnce(mockClient)
        .mockResolvedValueOnce(mockClient2)

      const client1 = await manager.getUserClient('user-123', 'token-123')
      const client2 = await manager.getUserClient('user-456', 'token-456')

      expect(client1).toBe(mockClient)
      expect(client2).toBe(mockClient2)
      expect(GoogleDriveClient.createUserClient).toHaveBeenCalledTimes(2)
    })

    it('should throw GeneralError when client creation fails', async () => {
      vi.mocked(GoogleDriveClient.createUserClient).mockRejectedValue(
        new Error('Auth failed'),
      )

      await expect(
        manager.getUserClient('user-123', 'token-123'),
      ).rejects.toThrow(GeneralError)
    })

    it('should recreate expired client', async () => {
      const mockClient2 = { ...mockClient } as any

      vi.mocked(GoogleDriveClient.createUserClient)
        .mockResolvedValueOnce(mockClient)
        .mockResolvedValueOnce(mockClient2)

      // First call - create client
      const client1 = await manager.getUserClient('user-123', 'token-123')
      expect(client1).toBe(mockClient)

      // Manually expire the client by setting expiry to past
      const userClients = (manager as any).userClients
      const cached = userClients.get('user-123')
      cached.expiry = Date.now() - 1000 // Expired

      // Second call - should recreate
      const client2 = await manager.getUserClient('user-123', 'token-123')
      expect(client2).toBe(mockClient2)
      expect(GoogleDriveClient.createUserClient).toHaveBeenCalledTimes(2)
    })
  })

  describe('clearUserClient', () => {
    it('should clear specific user client', async () => {
      vi.mocked(GoogleDriveClient.createUserClient).mockResolvedValue(
        mockClient,
      )

      await manager.getUserClient('user-123', 'token-123')
      manager.clearUserClient('user-123')

      // Should create new client after clearing
      await manager.getUserClient('user-123', 'token-123')

      expect(GoogleDriveClient.createUserClient).toHaveBeenCalledTimes(2)
    })

    it('should not throw error when clearing non-existent client', () => {
      expect(() => {
        manager.clearUserClient('non-existent')
      }).not.toThrow()
    })
  })

  describe('cleanupExpiredClients', () => {
    it('should remove expired user clients', async () => {
      vi.mocked(GoogleDriveClient.createUserClient).mockResolvedValue(
        mockClient,
      )

      // Create clients
      await manager.getUserClient('user-1', 'token-1')
      await manager.getUserClient('user-2', 'token-2')

      // Manually expire one client
      const userClients = (manager as any).userClients
      const cached = userClients.get('user-1')
      cached.expiry = Date.now() - 1000

      // Trigger cleanup
      ;(manager as any).cleanupExpiredClients()

      // user-1 should be removed, user-2 should remain
      const stats = manager.getStats()
      expect(stats.userClients).toBe(1)
    })

    it('should not remove non-expired clients', async () => {
      vi.mocked(GoogleDriveClient.createUserClient).mockResolvedValue(
        mockClient,
      )

      await manager.getUserClient('user-1', 'token-1')
      await manager.getUserClient('user-2', 'token-2')
      ;(manager as any).cleanupExpiredClients()

      const stats = manager.getStats()
      expect(stats.userClients).toBe(2)
    })
  })

  describe('reset', () => {
    it('should clear all clients', async () => {
      vi.mocked(GoogleDriveClient.createServiceAccountClient).mockResolvedValue(
        mockClient,
      )
      vi.mocked(GoogleDriveClient.createUserClient).mockResolvedValue(
        mockClient,
      )

      await manager.getServiceAccountClient()
      await manager.getUserClient('user-123', 'token-123')

      let stats = manager.getStats()
      expect(stats.serviceAccountClient).toBe(true)
      expect(stats.userClients).toBe(1)

      manager.reset()

      stats = manager.getStats()
      expect(stats.serviceAccountClient).toBe(false)
      expect(stats.userClients).toBe(0)
    })

    it('should allow creating new clients after reset', async () => {
      vi.mocked(GoogleDriveClient.createServiceAccountClient).mockResolvedValue(
        mockClient,
      )

      await manager.getServiceAccountClient()
      manager.reset()

      const client = await manager.getServiceAccountClient()
      expect(client).toBe(mockClient)
    })
  })

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      vi.mocked(GoogleDriveClient.createServiceAccountClient).mockResolvedValue(
        mockClient,
      )
      vi.mocked(GoogleDriveClient.createUserClient).mockResolvedValue(
        mockClient,
      )

      let stats = manager.getStats()
      expect(stats).toEqual({
        serviceAccountClient: false,
        userClients: 0,
      })

      await manager.getServiceAccountClient()
      await manager.getUserClient('user-1', 'token-1')
      await manager.getUserClient('user-2', 'token-2')

      stats = manager.getStats()
      expect(stats).toEqual({
        serviceAccountClient: true,
        userClients: 2,
      })
    })
  })

  describe('client caching behavior', () => {
    it('should maintain separate caches for service account and user clients', async () => {
      const mockServiceClient = { type: 'service' } as any
      const mockUserClient = { type: 'user' } as any

      vi.mocked(GoogleDriveClient.createServiceAccountClient).mockResolvedValue(
        mockServiceClient,
      )
      vi.mocked(GoogleDriveClient.createUserClient).mockResolvedValue(
        mockUserClient,
      )

      const serviceClient = await manager.getServiceAccountClient()
      const userClient = await manager.getUserClient('user-123', 'token-123')

      expect(serviceClient).not.toBe(userClient)
      expect(serviceClient).toBe(mockServiceClient)
      expect(userClient).toBe(mockUserClient)
    })

    it('should handle concurrent client creation requests', async () => {
      vi.mocked(
        GoogleDriveClient.createServiceAccountClient,
      ).mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(mockClient), 100)),
      )

      const [client1, client2, client3] = await Promise.all([
        manager.getServiceAccountClient(),
        manager.getServiceAccountClient(),
        manager.getServiceAccountClient(),
      ])

      // All should return the same cached instance eventually
      expect(client1).toBe(mockClient)
      expect(client2).toBe(mockClient)
      expect(client3).toBe(mockClient)
    })
  })

  describe('error handling', () => {
    it('should handle errors gracefully and not cache failed attempts', async () => {
      vi.mocked(GoogleDriveClient.createServiceAccountClient)
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(mockClient)

      // First attempt should fail
      await expect(manager.getServiceAccountClient()).rejects.toThrow(
        GeneralError,
      )

      // Second attempt should succeed
      const client = await manager.getServiceAccountClient()
      expect(client).toBe(mockClient)
    })

    it('should handle user client creation failures without affecting other users', async () => {
      const mockClient2 = { ...mockClient } as any

      vi.mocked(GoogleDriveClient.createUserClient)
        .mockRejectedValueOnce(new Error('User 1 failed'))
        .mockResolvedValueOnce(mockClient2)

      // First user fails
      await expect(manager.getUserClient('user-1', 'token-1')).rejects.toThrow(
        GeneralError,
      )

      // Second user succeeds
      const client = await manager.getUserClient('user-2', 'token-2')
      expect(client).toBe(mockClient2)
    })
  })
})
