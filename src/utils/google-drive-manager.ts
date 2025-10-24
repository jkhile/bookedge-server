import { GoogleDriveClient } from './google-drive-client'
import type { Application } from '../declarations'
import { logger } from '../logger'
import { GeneralError } from '@feathersjs/errors'

/**
 * Singleton manager for Google Drive client instances
 * Manages both service account and user clients
 */
export class GoogleDriveManager {
  private static instance: GoogleDriveManager
  private serviceAccountClient?: GoogleDriveClient
  private userClients: Map<
    string,
    { client: GoogleDriveClient; expiry: number }
  > = new Map()
  private app: Application

  // Cache TTL for user clients (1 hour)
  private static readonly USER_CLIENT_TTL = 60 * 60 * 1000

  private constructor(app: Application) {
    this.app = app
  }

  /**
   * Get the singleton instance
   */
  static getInstance(app: Application): GoogleDriveManager {
    if (!GoogleDriveManager.instance) {
      GoogleDriveManager.instance = new GoogleDriveManager(app)
    }
    return GoogleDriveManager.instance
  }

  /**
   * Get the service account client (creates if not exists)
   */
  async getServiceAccountClient(): Promise<GoogleDriveClient> {
    try {
      if (!this.serviceAccountClient) {
        logger.info('Creating new service account client')
        this.serviceAccountClient =
          await GoogleDriveClient.createServiceAccountClient()
      }
      return this.serviceAccountClient
    } catch (error) {
      logger.error('Failed to get service account client', error)
      throw new GeneralError('Failed to access Google Drive service')
    }
  }

  /**
   * Get a user-specific client (with caching)
   */
  async getUserClient(
    userId: string,
    accessToken: string,
  ): Promise<GoogleDriveClient> {
    try {
      // Clean up expired clients
      this.cleanupExpiredClients()

      // Check cache
      const cached = this.userClients.get(userId)
      if (cached && cached.expiry > Date.now()) {
        return cached.client
      }

      // Create new client
      logger.info(`Creating new client for user ${userId}`)
      const client = await GoogleDriveClient.createUserClient(accessToken)

      // Cache it
      this.userClients.set(userId, {
        client,
        expiry: Date.now() + GoogleDriveManager.USER_CLIENT_TTL,
      })

      return client
    } catch (error) {
      logger.error(`Failed to get user client for ${userId}`, error)
      throw new GeneralError('Failed to access user Google Drive')
    }
  }

  /**
   * Clear a user's cached client
   */
  clearUserClient(userId: string): void {
    this.userClients.delete(userId)
  }

  /**
   * Clean up expired user clients
   */
  private cleanupExpiredClients(): void {
    const now = Date.now()

    for (const [userId, cached] of this.userClients.entries()) {
      if (cached.expiry <= now) {
        this.userClients.delete(userId)
      }
    }
  }

  /**
   * Reset all clients (useful for testing or error recovery)
   */
  reset(): void {
    this.serviceAccountClient = undefined
    this.userClients.clear()
    logger.info('Reset all Google Drive clients')
  }

  /**
   * Get statistics about cached clients
   */
  getStats(): { serviceAccountClient: boolean; userClients: number } {
    return {
      serviceAccountClient: !!this.serviceAccountClient,
      userClients: this.userClients.size,
    }
  }
}
