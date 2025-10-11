import { randomUUID } from 'crypto'
import { logger } from '../logger'

export interface ChunkUploadInitData {
  bookId: number
  purpose: string
  description?: string
  finalized?: boolean
  metadata?: Record<string, any>
  file: {
    name: string
    type: string
    size: number
  }
}

export interface UploadSession {
  id: string
  userId: number
  fileMetadata: ChunkUploadInitData
  chunks: Map<number, Buffer>
  totalChunks: number
  receivedChunks: number
  totalBytes: number
  receivedBytes: number
  createdAt: Date
  lastActivityAt: Date
  chunkSize?: number
  // Google Drive resumable upload
  driveSessionUri?: string
  driveUploadedBytes?: number
  driveFileId?: string
}

export class UploadSessionManager {
  private sessions: Map<string, UploadSession> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null
  private sessionTimeout: number

  constructor(sessionTimeout: number = 3600000) {
    // Default 1 hour
    this.sessionTimeout = sessionTimeout
    this.startCleanupTask()
  }

  /**
   * Create a new upload session
   */
  createSession(
    userId: number,
    fileMetadata: ChunkUploadInitData,
    chunkSize: number,
  ): { uploadId: string; totalChunks: number } {
    const uploadId = randomUUID()
    const totalChunks = Math.ceil(fileMetadata.file.size / chunkSize)

    const session: UploadSession = {
      id: uploadId,
      userId,
      fileMetadata,
      chunks: new Map(),
      totalChunks,
      receivedChunks: 0,
      totalBytes: fileMetadata.file.size,
      receivedBytes: 0,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      chunkSize,
    }

    this.sessions.set(uploadId, session)

    logger.info('Upload session created', {
      uploadId,
      userId,
      fileName: fileMetadata.file.name,
      fileSize: fileMetadata.file.size,
      totalChunks,
    })

    return { uploadId, totalChunks }
  }

  /**
   * Get an existing session
   */
  getSession(uploadId: string): UploadSession | undefined {
    return this.sessions.get(uploadId)
  }

  /**
   * Set Google Drive resumable session URI for an upload
   */
  setDriveSessionUri(uploadId: string, sessionUri: string): void {
    const session = this.sessions.get(uploadId)
    if (session) {
      session.driveSessionUri = sessionUri
      session.driveUploadedBytes = 0
      logger.info('Drive session URI set', { uploadId, sessionUri })
    }
  }

  /**
   * Update Google Drive upload progress
   */
  updateDriveProgress(
    uploadId: string,
    uploadedBytes: number,
    fileId?: string,
  ): void {
    const session = this.sessions.get(uploadId)
    if (session) {
      session.driveUploadedBytes = uploadedBytes
      if (fileId) {
        session.driveFileId = fileId
      }
      session.lastActivityAt = new Date()
    }
  }

  /**
   * Store a chunk in the session
   */
  storeChunk(uploadId: string, chunkIndex: number, chunkData: Buffer): number {
    const session = this.sessions.get(uploadId)

    if (!session) {
      throw new Error(`Upload session not found: ${uploadId}`)
    }

    // Validate chunk index
    if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      throw new Error(
        `Invalid chunk index: ${chunkIndex} (total chunks: ${session.totalChunks})`,
      )
    }

    // Check if chunk already exists
    if (session.chunks.has(chunkIndex)) {
      logger.warn('Duplicate chunk received', { uploadId, chunkIndex })
      return this.calculateProgress(session)
    }

    // Store chunk in memory (used for tracking and fallback)
    session.chunks.set(chunkIndex, chunkData)
    session.receivedChunks++
    session.receivedBytes += chunkData.length
    session.lastActivityAt = new Date()

    return this.calculateProgress(session)
  }

  /**
   * Calculate progress percentage
   */
  private calculateProgress(session: UploadSession): number {
    return Math.round((session.receivedChunks / session.totalChunks) * 100)
  }

  /**
   * Check if all chunks have been received
   */
  isComplete(uploadId: string): boolean {
    const session = this.sessions.get(uploadId)
    if (!session) return false
    return session.receivedChunks === session.totalChunks
  }

  /**
   * Validate that all chunks are present and in order
   */
  validateChunks(uploadId: string): boolean {
    const session = this.sessions.get(uploadId)
    if (!session) return false

    // Check all chunk indices from 0 to totalChunks-1 are present
    for (let i = 0; i < session.totalChunks; i++) {
      if (!session.chunks.has(i)) {
        logger.error('Missing chunk', { uploadId, chunkIndex: i })
        return false
      }
    }

    return true
  }

  /**
   * Assemble all chunks into a single buffer (fallback for non-resumable uploads)
   */
  assembleChunks(uploadId: string): Buffer {
    const session = this.sessions.get(uploadId)

    if (!session) {
      throw new Error(`Upload session not found: ${uploadId}`)
    }

    if (!this.validateChunks(uploadId)) {
      throw new Error(`Cannot assemble chunks: missing chunks for ${uploadId}`)
    }

    // Assemble chunks in order
    const buffers: Buffer[] = []
    for (let i = 0; i < session.totalChunks; i++) {
      const chunk = session.chunks.get(i)
      if (chunk) {
        buffers.push(chunk)
      }
    }

    const assembled = Buffer.concat(buffers)

    logger.info('Chunks assembled', {
      uploadId,
      totalChunks: session.totalChunks,
      assembledSize: assembled.length,
      expectedSize: session.totalBytes,
    })

    return assembled
  }

  /**
   * Remove a session (cleanup or cancellation)
   */
  removeSession(uploadId: string): void {
    const session = this.sessions.get(uploadId)
    if (session) {
      // Clear chunk data
      session.chunks.clear()
      this.sessions.delete(uploadId)

      logger.info('Upload session removed', {
        uploadId,
        userId: session.userId,
        fileName: session.fileMetadata.file.name,
      })
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(uploadId: string): {
    progress: number
    receivedChunks: number
    totalChunks: number
    receivedBytes: number
    totalBytes: number
  } | null {
    const session = this.sessions.get(uploadId)
    if (!session) return null

    return {
      progress: this.calculateProgress(session),
      receivedChunks: session.receivedChunks,
      totalChunks: session.totalChunks,
      receivedBytes: session.receivedBytes,
      totalBytes: session.totalBytes,
    }
  }

  /**
   * Start background task to cleanup expired sessions
   */
  private startCleanupTask(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredSessions()
      },
      5 * 60 * 1000,
    )

    logger.info('Upload session cleanup task started', {
      interval: '5 minutes',
      sessionTimeout: this.sessionTimeout / 1000 + 's',
    })
  }

  /**
   * Stop the cleanup task
   */
  stopCleanupTask(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
      logger.info('Upload session cleanup task stopped')
    }
  }

  /**
   * Cleanup expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date()
    let cleanedCount = 0

    for (const [uploadId, session] of this.sessions.entries()) {
      const age = now.getTime() - session.lastActivityAt.getTime()

      if (age > this.sessionTimeout) {
        logger.info('Cleaning up expired upload session', {
          uploadId,
          userId: session.userId,
          fileName: session.fileMetadata.file.name,
          age: Math.round(age / 1000) + 's',
        })

        this.removeSession(uploadId)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      logger.info('Upload session cleanup completed', {
        cleaned: cleanedCount,
        remaining: this.sessions.size,
      })
    }
  }

  /**
   * Get count of active sessions
   */
  getActiveSessionCount(): number {
    return this.sessions.size
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: number): UploadSession[] {
    const userSessions: UploadSession[] = []

    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        userSessions.push(session)
      }
    }

    return userSessions
  }
}

// Singleton instance
let sessionManagerInstance: UploadSessionManager | null = null

export function getUploadSessionManager(
  sessionTimeout?: number,
): UploadSessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new UploadSessionManager(sessionTimeout)
  }
  return sessionManagerInstance
}
