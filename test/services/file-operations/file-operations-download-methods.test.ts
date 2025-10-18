import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { FileOperationsService } from '../../../src/services/file-operations/file-operations.class'
import type { Application } from '../../../src/declarations'
import type { Params } from '@feathersjs/feathers'
import { GoogleDriveManager } from '../../../src/utils/google-drive-manager'
import { GoogleDriveClient } from '../../../src/utils/google-drive-client'
import { BadRequest, NotFound } from '@feathersjs/errors'
import { Readable } from 'stream'

// Mock dependencies
vi.mock('../../../src/utils/google-drive-manager')
vi.mock('../../../src/utils/google-drive-client')
vi.mock('../../../src/logger')

describe('FileOperationsService - Download Methods', () => {
  let service: FileOperationsService
  let app: Application
  let mockDriveClient: GoogleDriveClient
  let mockDriveManager: GoogleDriveManager
  let mockBooksService: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock books service
    mockBooksService = {
      get: vi.fn(),
      patch: vi.fn(),
    }

    // Create mock app
    app = {
      service: vi.fn((name: string) => {
        if (name === 'books') return mockBooksService
        return null
      }),
      get: vi.fn((key: string) => {
        if (key === 'fileTransfer') {
          return {
            chunkSize: 1048576, // 1MB
            sessionTimeout: 3600000,
            chunkedThreshold: 10485760, // 10MB
          }
        }
        return null
      }),
      channel: vi.fn(() => ({
        send: vi.fn(),
      })),
    } as any

    // Create mock Drive client
    mockDriveClient = {
      getFile: vi.fn(),
      downloadFile: vi.fn(),
      downloadFileChunk: vi.fn(),
    } as any

    // Create mock Drive manager
    mockDriveManager = {
      getServiceAccountClient: vi.fn().mockResolvedValue(mockDriveClient),
    } as any

    vi.mocked(GoogleDriveManager.getInstance).mockReturnValue(mockDriveManager)

    // Create service instance
    service = new FileOperationsService(app)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('download', () => {
    const mockBook = {
      id: 1,
      title: 'Test Book',
      cover_file: 'https://drive.google.com/file/d/file-123/view',
      interior_file: 'https://drive.google.com/file/d/file-456/view',
    }

    const mockParams: Params = {
      user: {
        id: 123,
        email: 'test@example.com',
      },
      query: {
        purpose: 'cover',
      },
    }

    describe('download by bookId-purpose format', () => {
      it('should download small file with base64 data', async () => {
        mockBooksService.get.mockResolvedValue(mockBook)

        vi.mocked(mockDriveClient.getFile).mockResolvedValue({
          id: 'file-123',
          name: 'cover.pdf',
          size: '1024', // 1KB
          mimeType: 'application/pdf',
        })

        const mockStream = new Readable({
          read() {
            this.push(Buffer.from('test file content'))
            this.push(null)
          },
        })

        vi.mocked(mockDriveClient.downloadFile).mockResolvedValue(mockStream)

        const result = await service.download('1-cover', mockParams)

        expect(result.success).toBe(true)
        expect(result.fileId).toBe('file-123')
        expect(result.fileName).toBe('cover.pdf')
        expect(result.bookId).toBe(1)
        expect(result.purpose).toBe('cover')
        expect(result.data).toBeDefined()
        expect(result.url).toBeUndefined()
      })

      it('should return download URL for large files', async () => {
        mockBooksService.get.mockResolvedValue(mockBook)

        vi.mocked(mockDriveClient.getFile).mockResolvedValue({
          id: 'file-123',
          name: 'large-cover.pdf',
          size: '15728640', // 15MB
          mimeType: 'application/pdf',
          webContentLink: 'https://drive.google.com/uc?id=file-123',
        })

        const result = await service.download('1-cover', mockParams)

        expect(result.success).toBe(true)
        expect(result.fileId).toBe('file-123')
        expect(result.fileName).toBe('large-cover.pdf')
        expect(result.bookId).toBe(1)
        expect(result.purpose).toBe('cover')
        expect(result.data).toBeUndefined()
        expect(result.url).toBe('https://drive.google.com/uc?id=file-123')

        // Should not call downloadFile for large files
        expect(mockDriveClient.downloadFile).not.toHaveBeenCalled()
      })
    })

    describe('download by bookId with purpose in query', () => {
      it('should download using bookId and purpose from query', async () => {
        mockBooksService.get.mockResolvedValue(mockBook)

        vi.mocked(mockDriveClient.getFile).mockResolvedValue({
          id: 'file-123',
          name: 'cover.pdf',
          size: '1024',
          mimeType: 'application/pdf',
        })

        const mockStream = new Readable({
          read() {
            this.push(Buffer.from('test content'))
            this.push(null)
          },
        })

        vi.mocked(mockDriveClient.downloadFile).mockResolvedValue(mockStream)

        const result = await service.download(1, mockParams)

        expect(result.success).toBe(true)
        expect(result.bookId).toBe(1)
        expect(result.purpose).toBe('cover')
      })

      it('should throw error when purpose not provided', async () => {
        const paramsWithoutPurpose: Params = {
          user: { id: 123 },
          query: {},
        }

        await expect(service.download(1, paramsWithoutPurpose)).rejects.toThrow(
          BadRequest,
        )
      })
    })

    describe('direct download by Drive file ID', () => {
      it('should download file directly by Drive file ID', async () => {
        const driveFileId =
          '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

        vi.mocked(mockDriveClient.getFile).mockResolvedValue({
          id: driveFileId,
          name: 'gallery-image.jpg',
          size: '2048',
          mimeType: 'image/jpeg',
        })

        const mockStream = new Readable({
          read() {
            this.push(Buffer.from('image data'))
            this.push(null)
          },
        })

        vi.mocked(mockDriveClient.downloadFile).mockResolvedValue(mockStream)

        const result = await service.download(driveFileId, mockParams)

        expect(result.success).toBe(true)
        expect(result.fileId).toBe(driveFileId)
        expect(result.fileName).toBe('gallery-image.jpg')
        expect(result.data).toBeDefined()

        // Should not query books service for direct file ID
        expect(mockBooksService.get).not.toHaveBeenCalled()
      })

      it('should return URL for large files when downloading by file ID', async () => {
        const driveFileId = '1234567890abcdefghijklmnopqrstuvwxyz'

        vi.mocked(mockDriveClient.getFile).mockResolvedValue({
          id: driveFileId,
          name: 'large-image.jpg',
          size: '20971520', // 20MB
          mimeType: 'image/jpeg',
          webContentLink: 'https://drive.google.com/uc?id=' + driveFileId,
        })

        const result = await service.download(driveFileId, mockParams)

        expect(result.success).toBe(true)
        expect(result.url).toBeDefined()
        expect(result.data).toBeUndefined()
      })
    })

    describe('error handling', () => {
      it('should throw error for invalid purpose', async () => {
        const invalidParams: Params = {
          user: { id: 123 },
          query: { purpose: 'invalid-purpose' },
        }

        mockBooksService.get.mockResolvedValue(mockBook)

        await expect(service.download(1, invalidParams)).rejects.toThrow(
          BadRequest,
        )
      })

      it('should throw NotFound when file not in book record', async () => {
        const bookWithoutFile = {
          id: 1,
          title: 'Test Book',
          cover_file: null,
        }

        mockBooksService.get.mockResolvedValue(bookWithoutFile)

        await expect(service.download('1-cover', mockParams)).rejects.toThrow(
          NotFound,
        )
      })

      it('should throw error when book not found', async () => {
        mockBooksService.get.mockRejectedValue(new NotFound('Book not found'))

        await expect(service.download('1-cover', mockParams)).rejects.toThrow(
          NotFound,
        )
      })

      it('should throw error when Drive file ID cannot be extracted', async () => {
        const bookWithInvalidUrl = {
          id: 1,
          title: 'Test Book',
          cover_file: 'invalid-url',
        }

        mockBooksService.get.mockResolvedValue(bookWithInvalidUrl)

        await expect(service.download('1-cover', mockParams)).rejects.toThrow(
          BadRequest,
        )
      })

      it('should handle Drive client errors', async () => {
        mockBooksService.get.mockResolvedValue(mockBook)

        vi.mocked(mockDriveClient.getFile).mockRejectedValue(
          new Error('Drive API error'),
        )

        await expect(service.download('1-cover', mockParams)).rejects.toThrow(
          'Drive API error',
        )
      })

      it('should handle stream errors during download', async () => {
        mockBooksService.get.mockResolvedValue(mockBook)

        vi.mocked(mockDriveClient.getFile).mockResolvedValue({
          id: 'file-123',
          name: 'cover.pdf',
          size: '1024',
          mimeType: 'application/pdf',
        })

        const errorStream = new Readable({
          read() {
            this.emit('error', new Error('Stream error'))
          },
        })

        vi.mocked(mockDriveClient.downloadFile).mockResolvedValue(errorStream)

        await expect(service.download('1-cover', mockParams)).rejects.toThrow(
          'Stream error',
        )
      })
    })

    describe('different file purposes', () => {
      const purposes = [
        'cover',
        'interior',
        'marketing',
        'media_kit',
        'discussion_guide',
      ]

      purposes.forEach((purpose) => {
        it(`should download ${purpose} file`, async () => {
          const bookWithFile = {
            id: 1,
            title: 'Test Book',
            [`${purpose === 'marketing' || purpose === 'media_kit' ? 'media_kit_link' : purpose === 'discussion_guide' ? 'discussion_guide_link' : purpose + '_file'}`]:
              'https://drive.google.com/file/d/test-file/view',
          }

          mockBooksService.get.mockResolvedValue(bookWithFile)

          vi.mocked(mockDriveClient.getFile).mockResolvedValue({
            id: 'test-file',
            name: `${purpose}.pdf`,
            size: '1024',
            mimeType: 'application/pdf',
          })

          const mockStream = new Readable({
            read() {
              this.push(Buffer.from('test'))
              this.push(null)
            },
          })

          vi.mocked(mockDriveClient.downloadFile).mockResolvedValue(mockStream)

          const result = await service.download(`1-${purpose}`, {
            ...mockParams,
            query: { purpose },
          })

          expect(result.success).toBe(true)
          expect(result.purpose).toBe(purpose)
        })
      })
    })

    describe('URL format extraction', () => {
      const urlFormats = [
        {
          url: 'https://drive.google.com/file/d/FILE_ID_123/view',
          fileId: 'FILE_ID_123',
        },
        {
          url: 'https://drive.google.com/open?id=FILE_ID_456',
          fileId: 'FILE_ID_456',
        },
        {
          url: 'https://drive.google.com/d/FILE_ID_789',
          fileId: 'FILE_ID_789',
        },
      ]

      urlFormats.forEach(({ url, fileId }) => {
        it(`should extract file ID from ${url}`, async () => {
          const book = {
            id: 1,
            title: 'Test Book',
            cover_file: url,
          }

          mockBooksService.get.mockResolvedValue(book)

          vi.mocked(mockDriveClient.getFile).mockResolvedValue({
            id: fileId,
            name: 'file.pdf',
            size: '1024',
            mimeType: 'application/pdf',
          })

          const mockStream = new Readable({
            read() {
              this.push(Buffer.from('test'))
              this.push(null)
            },
          })

          vi.mocked(mockDriveClient.downloadFile).mockResolvedValue(mockStream)

          const result = await service.download('1-cover', mockParams)

          expect(result.fileId).toBe(fileId)
          expect(mockDriveClient.getFile).toHaveBeenCalledWith(fileId)
        })
      })
    })
  })

  describe('downloadChunkInit', () => {
    const mockBook = {
      id: 1,
      title: 'Test Book',
      cover_file: 'https://drive.google.com/file/d/file-123/view',
    }

    const mockParams: Params = {
      user: {
        id: 123,
        email: 'test@example.com',
      },
      connection: {},
    }

    it('should initialize chunked download for large file', async () => {
      mockBooksService.get.mockResolvedValue(mockBook)

      vi.mocked(mockDriveClient.getFile).mockResolvedValue({
        id: 'file-123',
        name: 'large-file.pdf',
        size: '20971520', // 20MB
        mimeType: 'application/pdf',
      })

      const result = await service.downloadChunkInit(
        { bookId: 1, purpose: 'cover' },
        mockParams,
      )

      expect(result.downloadId).toBeDefined()
      expect(result.totalChunks).toBeGreaterThan(0)
      expect(result.chunkSize).toBe(1048576) // 1MB
      expect(result.fileName).toBe('large-file.pdf')
      expect(result.fileSize).toBe(20971520)
    })

    it('should return zero chunks for small files', async () => {
      mockBooksService.get.mockResolvedValue(mockBook)

      vi.mocked(mockDriveClient.getFile).mockResolvedValue({
        id: 'file-123',
        name: 'small-file.pdf',
        size: '1024', // 1KB
        mimeType: 'application/pdf',
      })

      const result = await service.downloadChunkInit(
        { bookId: 1, purpose: 'cover' },
        mockParams,
      )

      expect(result.totalChunks).toBe(0)
      expect(result.chunkSize).toBe(0)
      expect(result.downloadId).toBeUndefined()
    })

    it('should throw error when user not authenticated', async () => {
      const paramsWithoutUser: Params = {}

      await expect(
        service.downloadChunkInit(
          { bookId: 1, purpose: 'cover' },
          paramsWithoutUser,
        ),
      ).rejects.toThrow(BadRequest)
    })

    it('should throw error for invalid purpose', async () => {
      await expect(
        service.downloadChunkInit(
          { bookId: 1, purpose: 'invalid' },
          mockParams,
        ),
      ).rejects.toThrow(BadRequest)
    })

    it('should throw NotFound when file not found', async () => {
      const bookWithoutFile = {
        id: 1,
        title: 'Test Book',
        cover_file: null,
      }

      mockBooksService.get.mockResolvedValue(bookWithoutFile)

      await expect(
        service.downloadChunkInit({ bookId: 1, purpose: 'cover' }, mockParams),
      ).rejects.toThrow(NotFound)
    })

    it('should calculate correct number of chunks', async () => {
      mockBooksService.get.mockResolvedValue(mockBook)

      vi.mocked(mockDriveClient.getFile).mockResolvedValue({
        id: 'file-123',
        name: 'file.pdf',
        size: '10485760', // Exactly 10MB
        mimeType: 'application/pdf',
      })

      const result = await service.downloadChunkInit(
        { bookId: 1, purpose: 'cover' },
        mockParams,
      )

      // With 1MB chunks and 10MB file (below 10MB threshold)
      expect(result.totalChunks).toBe(0) // Should use direct download
    })

    it('should handle files just above threshold', async () => {
      mockBooksService.get.mockResolvedValue(mockBook)

      vi.mocked(mockDriveClient.getFile).mockResolvedValue({
        id: 'file-123',
        name: 'file.pdf',
        size: '10485761', // 1 byte over 10MB threshold
        mimeType: 'application/pdf',
      })

      const result = await service.downloadChunkInit(
        { bookId: 1, purpose: 'cover' },
        mockParams,
      )

      expect(result.totalChunks).toBeGreaterThan(0)
      expect(result.downloadId).toBeDefined()
    })
  })

  describe('downloadChunk', () => {
    const mockParams: Params = {
      user: { id: 123, email: 'test@example.com' },
      connection: {},
    }

    beforeEach(async () => {
      // Set up a download session first
      const mockBook = {
        id: 1,
        title: 'Test Book',
        cover_file: 'https://drive.google.com/file/d/file-123/view',
      }

      mockBooksService.get.mockResolvedValue(mockBook)

      vi.mocked(mockDriveClient.getFile).mockResolvedValue({
        id: 'file-123',
        name: 'large-file.pdf',
        size: '20971520', // 20MB
        mimeType: 'application/pdf',
      })

      await service.downloadChunkInit(
        { bookId: 1, purpose: 'cover' },
        mockParams,
      )
    })

    it('should download first chunk', async () => {
      const downloadId = `1-cover-${Date.now()}`
      // Get actual download ID from session
      const sessions = (service as any).downloadSessions
      const actualDownloadId = Array.from(sessions.keys())[0]

      const chunkData = Buffer.from('chunk data 0')
      vi.mocked(mockDriveClient.downloadFileChunk).mockResolvedValue(chunkData)

      const result = await service.downloadChunk(
        { downloadId: actualDownloadId, chunkIndex: 0 },
        mockParams,
      )

      expect(result.data).toBeDefined()
      expect(result.chunkIndex).toBe(0)
      expect(result.totalChunks).toBeGreaterThan(0)
      expect(result.complete).toBe(false)
    })

    it('should download last chunk and mark complete', async () => {
      const sessions = (service as any).downloadSessions
      const actualDownloadId = Array.from(sessions.keys())[0]
      const session = sessions.get(actualDownloadId)
      const lastChunkIndex = session.totalChunks - 1

      const chunkData = Buffer.from('last chunk data')
      vi.mocked(mockDriveClient.downloadFileChunk).mockResolvedValue(chunkData)

      const result = await service.downloadChunk(
        { downloadId: actualDownloadId, chunkIndex: lastChunkIndex },
        mockParams,
      )

      expect(result.complete).toBe(true)
      expect(result.chunkIndex).toBe(lastChunkIndex)

      // Session should be cleaned up
      expect(sessions.has(actualDownloadId)).toBe(false)
    })

    it('should throw error for invalid download session', async () => {
      await expect(
        service.downloadChunk(
          { downloadId: 'invalid-session-id', chunkIndex: 0 },
          mockParams,
        ),
      ).rejects.toThrow(NotFound)
    })

    it('should throw error for unauthorized user', async () => {
      const sessions = (service as any).downloadSessions
      const actualDownloadId = Array.from(sessions.keys())[0]

      const unauthorizedParams: Params = {
        user: { id: 999, email: 'other@example.com' },
      }

      await expect(
        service.downloadChunk(
          { downloadId: actualDownloadId, chunkIndex: 0 },
          unauthorizedParams,
        ),
      ).rejects.toThrow(BadRequest)
    })

    it('should throw error for invalid chunk index', async () => {
      const sessions = (service as any).downloadSessions
      const actualDownloadId = Array.from(sessions.keys())[0]

      await expect(
        service.downloadChunk(
          { downloadId: actualDownloadId, chunkIndex: 9999 },
          mockParams,
        ),
      ).rejects.toThrow(BadRequest)
    })

    it('should throw error for negative chunk index', async () => {
      const sessions = (service as any).downloadSessions
      const actualDownloadId = Array.from(sessions.keys())[0]

      await expect(
        service.downloadChunk(
          { downloadId: actualDownloadId, chunkIndex: -1 },
          mockParams,
        ),
      ).rejects.toThrow(BadRequest)
    })

    it('should update session last activity time', async () => {
      const sessions = (service as any).downloadSessions
      const actualDownloadId = Array.from(sessions.keys())[0]
      const session = sessions.get(actualDownloadId)
      const originalTime = session.lastActivityAt

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10))

      const chunkData = Buffer.from('chunk data')
      vi.mocked(mockDriveClient.downloadFileChunk).mockResolvedValue(chunkData)

      await service.downloadChunk(
        { downloadId: actualDownloadId, chunkIndex: 0 },
        mockParams,
      )

      const updatedSession = sessions.get(actualDownloadId)
      if (updatedSession) {
        expect(updatedSession.lastActivityAt.getTime()).toBeGreaterThan(
          originalTime.getTime(),
        )
      }
    })
  })

  describe('downloadChunkCancel', () => {
    const mockParams: Params = {
      user: { id: 123, email: 'test@example.com' },
      connection: {},
    }

    beforeEach(async () => {
      const mockBook = {
        id: 1,
        title: 'Test Book',
        cover_file: 'https://drive.google.com/file/d/file-123/view',
      }

      mockBooksService.get.mockResolvedValue(mockBook)

      vi.mocked(mockDriveClient.getFile).mockResolvedValue({
        id: 'file-123',
        name: 'large-file.pdf',
        size: '20971520',
        mimeType: 'application/pdf',
      })

      await service.downloadChunkInit(
        { bookId: 1, purpose: 'cover' },
        mockParams,
      )
    })

    it('should cancel download session', async () => {
      const sessions = (service as any).downloadSessions
      const actualDownloadId = Array.from(sessions.keys())[0]

      expect(sessions.has(actualDownloadId)).toBe(true)

      await service.downloadChunkCancel(actualDownloadId, mockParams)

      expect(sessions.has(actualDownloadId)).toBe(false)
    })

    it('should not throw error for non-existent session', async () => {
      await expect(
        service.downloadChunkCancel('non-existent-id', mockParams),
      ).resolves.toBeUndefined()
    })

    it('should throw error for unauthorized user', async () => {
      const sessions = (service as any).downloadSessions
      const actualDownloadId = Array.from(sessions.keys())[0]

      const unauthorizedParams: Params = {
        user: { id: 999, email: 'other@example.com' },
      }

      await expect(
        service.downloadChunkCancel(actualDownloadId, unauthorizedParams),
      ).rejects.toThrow(BadRequest)
    })

    it('should prevent further downloads after cancellation', async () => {
      const sessions = (service as any).downloadSessions
      const actualDownloadId = Array.from(sessions.keys())[0]

      await service.downloadChunkCancel(actualDownloadId, mockParams)

      await expect(
        service.downloadChunk(
          { downloadId: actualDownloadId, chunkIndex: 0 },
          mockParams,
        ),
      ).rejects.toThrow(NotFound)
    })
  })
})
