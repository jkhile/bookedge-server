import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  UploadSessionManager,
  type ChunkUploadInitData,
} from '../../src/utils/upload-session-manager'

describe('UploadSessionManager', () => {
  let sessionManager: UploadSessionManager

  beforeEach(() => {
    sessionManager = new UploadSessionManager(60000) // 1 minute timeout for tests
  })

  afterEach(() => {
    sessionManager.stopCleanupTask()
  })

  describe('createSession', () => {
    it('should create a new upload session', () => {
      const fileMetadata: ChunkUploadInitData = {
        book_id: 1,
        purpose: 'cover',
        file: {
          name: 'test.pdf',
          type: 'application/pdf',
          size: 5000000, // 5MB
        },
      }

      const chunkSize = 1048576 // 1MB
      const { uploadId, totalChunks } = sessionManager.createSession(
        123,
        fileMetadata,
        chunkSize,
      )

      expect(uploadId).toBeDefined()
      expect(uploadId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      )
      expect(totalChunks).toBe(5) // 5MB / 1MB = 5 chunks
    })

    it('should calculate total chunks correctly', () => {
      const fileMetadata: ChunkUploadInitData = {
        book_id: 1,
        purpose: 'manuscript',
        file: {
          name: 'large.pdf',
          type: 'application/pdf',
          size: 10500000, // 10.5MB
        },
      }

      const chunkSize = 1048576 // 1MB
      const { totalChunks } = sessionManager.createSession(
        123,
        fileMetadata,
        chunkSize,
      )

      expect(totalChunks).toBe(11) // ceil(10.5MB / 1MB) = 11 chunks
    })
  })

  describe('getSession', () => {
    it('should retrieve an existing session', () => {
      const fileMetadata: ChunkUploadInitData = {
        book_id: 1,
        purpose: 'cover',
        file: {
          name: 'test.pdf',
          type: 'application/pdf',
          size: 5000000,
        },
      }

      const { uploadId } = sessionManager.createSession(
        123,
        fileMetadata,
        1048576,
      )
      const session = sessionManager.getSession(uploadId)

      expect(session).toBeDefined()
      expect(session?.id).toBe(uploadId)
      expect(session?.userId).toBe(123)
      expect(session?.fileMetadata.file.name).toBe('test.pdf')
    })

    it('should return undefined for non-existent session', () => {
      const session = sessionManager.getSession('non-existent-id')
      expect(session).toBeUndefined()
    })
  })

  describe('storeChunk', () => {
    it('should store a chunk and update progress', () => {
      const fileMetadata: ChunkUploadInitData = {
        book_id: 1,
        purpose: 'cover',
        file: {
          name: 'test.pdf',
          type: 'application/pdf',
          size: 3000000, // 3MB
        },
      }

      const { uploadId } = sessionManager.createSession(
        123,
        fileMetadata,
        1048576,
      )
      const chunkData = Buffer.alloc(1048576) // 1MB chunk

      const progress = sessionManager.storeChunk(uploadId, 0, chunkData)

      expect(progress).toBe(33) // 1 of 3 chunks = 33%
    })

    it('should track multiple chunks', () => {
      const fileMetadata: ChunkUploadInitData = {
        book_id: 1,
        purpose: 'cover',
        file: {
          name: 'test.pdf',
          type: 'application/pdf',
          size: 3000000,
        },
      }

      const { uploadId } = sessionManager.createSession(
        123,
        fileMetadata,
        1048576,
      )
      const chunkData = Buffer.alloc(1048576)

      sessionManager.storeChunk(uploadId, 0, chunkData)
      sessionManager.storeChunk(uploadId, 1, chunkData)
      const progress = sessionManager.storeChunk(uploadId, 2, chunkData)

      expect(progress).toBe(100) // 3 of 3 chunks = 100%
    })

    it('should throw error for invalid chunk index', () => {
      const fileMetadata: ChunkUploadInitData = {
        book_id: 1,
        purpose: 'cover',
        file: {
          name: 'test.pdf',
          type: 'application/pdf',
          size: 3000000,
        },
      }

      const { uploadId } = sessionManager.createSession(
        123,
        fileMetadata,
        1048576,
      )
      const chunkData = Buffer.alloc(1048576)

      expect(() => {
        sessionManager.storeChunk(uploadId, 10, chunkData) // Invalid index
      }).toThrow('Invalid chunk index')
    })

    it('should handle duplicate chunks gracefully', () => {
      const fileMetadata: ChunkUploadInitData = {
        book_id: 1,
        purpose: 'cover',
        file: {
          name: 'test.pdf',
          type: 'application/pdf',
          size: 3000000,
        },
      }

      const { uploadId } = sessionManager.createSession(
        123,
        fileMetadata,
        1048576,
      )
      const chunkData = Buffer.alloc(1048576)

      const progress1 = sessionManager.storeChunk(uploadId, 0, chunkData)
      const progress2 = sessionManager.storeChunk(uploadId, 0, chunkData) // Duplicate

      expect(progress1).toBe(progress2) // Progress should not change
    })
  })

  describe('isComplete', () => {
    it('should return false when not all chunks received', () => {
      const fileMetadata: ChunkUploadInitData = {
        book_id: 1,
        purpose: 'cover',
        file: {
          name: 'test.pdf',
          type: 'application/pdf',
          size: 3000000,
        },
      }

      const { uploadId } = sessionManager.createSession(
        123,
        fileMetadata,
        1048576,
      )
      const chunkData = Buffer.alloc(1048576)

      sessionManager.storeChunk(uploadId, 0, chunkData)

      expect(sessionManager.isComplete(uploadId)).toBe(false)
    })

    it('should return true when all chunks received', () => {
      const fileMetadata: ChunkUploadInitData = {
        book_id: 1,
        purpose: 'cover',
        file: {
          name: 'test.pdf',
          type: 'application/pdf',
          size: 2097152, // Exactly 2MB
        },
      }

      const { uploadId } = sessionManager.createSession(
        123,
        fileMetadata,
        1048576,
      )
      const chunkData = Buffer.alloc(1048576)

      sessionManager.storeChunk(uploadId, 0, chunkData)
      sessionManager.storeChunk(uploadId, 1, chunkData)

      expect(sessionManager.isComplete(uploadId)).toBe(true)
    })
  })

  describe('validateChunks', () => {
    it('should return true when all chunks present', () => {
      const fileMetadata: ChunkUploadInitData = {
        book_id: 1,
        purpose: 'cover',
        file: {
          name: 'test.pdf',
          type: 'application/pdf',
          size: 2097152,
        },
      }

      const { uploadId } = sessionManager.createSession(
        123,
        fileMetadata,
        1048576,
      )
      const chunkData = Buffer.alloc(1048576)

      sessionManager.storeChunk(uploadId, 0, chunkData)
      sessionManager.storeChunk(uploadId, 1, chunkData)

      expect(sessionManager.validateChunks(uploadId)).toBe(true)
    })

    it('should return false when chunks are missing', () => {
      const fileMetadata: ChunkUploadInitData = {
        book_id: 1,
        purpose: 'cover',
        file: {
          name: 'test.pdf',
          type: 'application/pdf',
          size: 3145728, // 3MB
        },
      }

      const { uploadId } = sessionManager.createSession(
        123,
        fileMetadata,
        1048576,
      )
      const chunkData = Buffer.alloc(1048576)

      sessionManager.storeChunk(uploadId, 0, chunkData)
      sessionManager.storeChunk(uploadId, 2, chunkData) // Missing chunk 1

      expect(sessionManager.validateChunks(uploadId)).toBe(false)
    })
  })

  describe('assembleChunks', () => {
    it('should assemble chunks in correct order', () => {
      const fileMetadata: ChunkUploadInitData = {
        book_id: 1,
        purpose: 'cover',
        file: {
          name: 'test.pdf',
          type: 'application/pdf',
          size: 300, // 300 bytes
        },
      }

      const { uploadId } = sessionManager.createSession(123, fileMetadata, 100)

      // Store chunks with identifiable data
      const chunk0 = Buffer.from('A'.repeat(100))
      const chunk1 = Buffer.from('B'.repeat(100))
      const chunk2 = Buffer.from('C'.repeat(100))

      sessionManager.storeChunk(uploadId, 0, chunk0)
      sessionManager.storeChunk(uploadId, 1, chunk1)
      sessionManager.storeChunk(uploadId, 2, chunk2)

      const assembled = sessionManager.assembleChunks(uploadId)

      expect(assembled.length).toBe(300)
      expect(assembled.toString()).toBe(
        'A'.repeat(100) + 'B'.repeat(100) + 'C'.repeat(100),
      )
    })

    it('should throw error when trying to assemble incomplete chunks', () => {
      const fileMetadata: ChunkUploadInitData = {
        book_id: 1,
        purpose: 'cover',
        file: {
          name: 'test.pdf',
          type: 'application/pdf',
          size: 300,
        },
      }

      const { uploadId } = sessionManager.createSession(123, fileMetadata, 100)
      const chunk0 = Buffer.from('A'.repeat(100))

      sessionManager.storeChunk(uploadId, 0, chunk0)

      expect(() => {
        sessionManager.assembleChunks(uploadId)
      }).toThrow('Cannot assemble chunks: missing chunks')
    })
  })

  describe('removeSession', () => {
    it('should remove a session', () => {
      const fileMetadata: ChunkUploadInitData = {
        book_id: 1,
        purpose: 'cover',
        file: {
          name: 'test.pdf',
          type: 'application/pdf',
          size: 1000000,
        },
      }

      const { uploadId } = sessionManager.createSession(
        123,
        fileMetadata,
        1048576,
      )

      expect(sessionManager.getSession(uploadId)).toBeDefined()

      sessionManager.removeSession(uploadId)

      expect(sessionManager.getSession(uploadId)).toBeUndefined()
    })

    it('should handle removing non-existent session', () => {
      expect(() => {
        sessionManager.removeSession('non-existent')
      }).not.toThrow()
    })
  })

  describe('getSessionStats', () => {
    it('should return session statistics', () => {
      const fileMetadata: ChunkUploadInitData = {
        book_id: 1,
        purpose: 'cover',
        file: {
          name: 'test.pdf',
          type: 'application/pdf',
          size: 3000000,
        },
      }

      const { uploadId } = sessionManager.createSession(
        123,
        fileMetadata,
        1048576,
      )
      const chunkData = Buffer.alloc(1048576)

      sessionManager.storeChunk(uploadId, 0, chunkData)

      const stats = sessionManager.getSessionStats(uploadId)

      expect(stats).toBeDefined()
      expect(stats?.progress).toBe(33)
      expect(stats?.receivedChunks).toBe(1)
      expect(stats?.totalChunks).toBe(3)
      expect(stats?.receivedBytes).toBe(1048576)
      expect(stats?.totalBytes).toBe(3000000)
    })

    it('should return null for non-existent session', () => {
      const stats = sessionManager.getSessionStats('non-existent')
      expect(stats).toBeNull()
    })
  })

  describe('getUserSessions', () => {
    it('should return all sessions for a user', () => {
      const fileMetadata1: ChunkUploadInitData = {
        book_id: 1,
        purpose: 'cover',
        file: {
          name: 'test1.pdf',
          type: 'application/pdf',
          size: 1000000,
        },
      }

      const fileMetadata2: ChunkUploadInitData = {
        book_id: 2,
        purpose: 'manuscript',
        file: {
          name: 'test2.pdf',
          type: 'application/pdf',
          size: 2000000,
        },
      }

      sessionManager.createSession(123, fileMetadata1, 1048576)
      sessionManager.createSession(123, fileMetadata2, 1048576)
      sessionManager.createSession(456, fileMetadata1, 1048576)

      const userSessions = sessionManager.getUserSessions(123)

      expect(userSessions).toHaveLength(2)
      expect(userSessions.every((s) => s.userId === 123)).toBe(true)
    })

    it('should return empty array when user has no sessions', () => {
      const userSessions = sessionManager.getUserSessions(999)
      expect(userSessions).toHaveLength(0)
    })
  })

  describe('cleanup', () => {
    it('should track active session count', () => {
      const fileMetadata: ChunkUploadInitData = {
        book_id: 1,
        purpose: 'cover',
        file: {
          name: 'test.pdf',
          type: 'application/pdf',
          size: 1000000,
        },
      }

      expect(sessionManager.getActiveSessionCount()).toBe(0)

      const { uploadId: id1 } = sessionManager.createSession(
        123,
        fileMetadata,
        1048576,
      )
      expect(sessionManager.getActiveSessionCount()).toBe(1)

      const { uploadId: id2 } = sessionManager.createSession(
        456,
        fileMetadata,
        1048576,
      )
      expect(sessionManager.getActiveSessionCount()).toBe(2)

      sessionManager.removeSession(id1)
      expect(sessionManager.getActiveSessionCount()).toBe(1)

      sessionManager.removeSession(id2)
      expect(sessionManager.getActiveSessionCount()).toBe(0)
    })
  })
})
