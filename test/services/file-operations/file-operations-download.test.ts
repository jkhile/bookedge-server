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

describe('FileOperationsService - Download', () => {
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
            chunkSize: 1048576,
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
    const mockParams: Params = {
      user: {
        id: 123,
        email: 'test@example.com',
      },
    }

    it('should download small file and return base64 data', async () => {
      const mockBook = {
        id: 1,
        title: 'Test Book',
        cover_file: 'https://drive.google.com/file/d/file-123/view',
      }

      mockBooksService.get.mockResolvedValue(mockBook)

      vi.mocked(mockDriveClient.getFile).mockResolvedValue({
        id: 'file-123',
        name: 'cover.pdf',
        mimeType: 'application/pdf',
        size: '1024', // 1KB - small file
      })

      // Create a mock readable stream
      const mockStream = new Readable()
      mockStream.push('test content')
      mockStream.push(null) // End stream

      vi.mocked(mockDriveClient.downloadFile).mockResolvedValue(
        mockStream as any,
      )

      const result = await service.download(1, {
        ...mockParams,
        query: { purpose: 'cover' },
      })

      expect(result).toEqual({
        success: true,
        fileId: 'file-123',
        fileName: 'cover.pdf',
        bookId: 1,
        purpose: 'cover',
        data: expect.any(String), // base64 encoded data
      })

      expect(result.data).toBe(Buffer.from('test content').toString('base64'))
    })

    it('should handle large file and return download URL', async () => {
      const mockBook = {
        id: 1,
        title: 'Test Book',
        interior_file: 'https://drive.google.com/file/d/file-456/view',
      }

      mockBooksService.get.mockResolvedValue(mockBook)

      vi.mocked(mockDriveClient.getFile).mockResolvedValue({
        id: 'file-456',
        name: 'interior.pdf',
        mimeType: 'application/pdf',
        size: '20971520', // 20MB - large file
        webContentLink: 'https://drive.google.com/uc?id=file-456',
      })

      const result = await service.download(1, {
        ...mockParams,
        query: { purpose: 'interior' },
      })

      expect(result).toEqual({
        success: true,
        fileId: 'file-456',
        fileName: 'interior.pdf',
        bookId: 1,
        purpose: 'interior',
        url: 'https://drive.google.com/uc?id=file-456',
      })

      // Should not call downloadFile for large files
      expect(mockDriveClient.downloadFile).not.toHaveBeenCalled()
    })

    it('should parse bookId-purpose format', async () => {
      const mockBook = {
        id: 5,
        title: 'Test Book',
        cover_file: 'https://drive.google.com/file/d/file-789/view',
      }

      mockBooksService.get.mockResolvedValue(mockBook)

      vi.mocked(mockDriveClient.getFile).mockResolvedValue({
        id: 'file-789',
        name: 'cover.pdf',
        mimeType: 'application/pdf',
        size: '1024',
      })

      const mockStream = new Readable()
      mockStream.push('content')
      mockStream.push(null)

      vi.mocked(mockDriveClient.downloadFile).mockResolvedValue(
        mockStream as any,
      )

      const result = await service.download('5-cover', mockParams)

      expect(result.bookId).toBe(5)
      expect(result.purpose).toBe('cover')
      expect(mockBooksService.get).toHaveBeenCalledWith(5)
    })

    it('should throw BadRequest when purpose not provided', async () => {
      await expect(service.download(1, mockParams)).rejects.toThrow(BadRequest)
    })

    it('should throw BadRequest for invalid purpose', async () => {
      await expect(
        service.download(1, {
          ...mockParams,
          query: { purpose: 'invalid' },
        }),
      ).rejects.toThrow(BadRequest)
    })

    it('should throw NotFound when file URL not in book record', async () => {
      const mockBook = {
        id: 1,
        title: 'Test Book',
        cover_file: '', // No file
      }

      mockBooksService.get.mockResolvedValue(mockBook)

      await expect(
        service.download(1, {
          ...mockParams,
          query: { purpose: 'cover' },
        }),
      ).rejects.toThrow(NotFound)
    })

    it('should throw BadRequest for invalid Drive URL', async () => {
      const mockBook = {
        id: 1,
        title: 'Test Book',
        cover_file: 'https://example.com/not-a-drive-url',
      }

      mockBooksService.get.mockResolvedValue(mockBook)

      await expect(
        service.download(1, {
          ...mockParams,
          query: { purpose: 'cover' },
        }),
      ).rejects.toThrow(BadRequest)
    })

    it('should extract file ID from various Drive URL formats', async () => {
      const urlFormats = [
        'https://drive.google.com/file/d/FILE_ID/view',
        'https://drive.google.com/open?id=FILE_ID',
        'https://drive.google.com/d/FILE_ID',
      ]

      for (const url of urlFormats) {
        mockBooksService.get.mockResolvedValue({
          id: 1,
          cover_file: url,
        })

        vi.mocked(mockDriveClient.getFile).mockResolvedValue({
          id: 'FILE_ID',
          name: 'test.pdf',
          mimeType: 'application/pdf',
          size: '1024',
        })

        const mockStream = new Readable()
        mockStream.push('content')
        mockStream.push(null)

        vi.mocked(mockDriveClient.downloadFile).mockResolvedValue(
          mockStream as any,
        )

        const result = await service.download(1, {
          ...mockParams,
          query: { purpose: 'cover' },
        })

        expect(result.fileId).toBe('FILE_ID')
      }
    })

    it('should handle different file purposes', async () => {
      const purposes = [
        { purpose: 'cover', column: 'cover_file' },
        { purpose: 'interior', column: 'interior_file' },
        { purpose: 'marketing', column: 'media_kit_link' },
        { purpose: 'discussion_guide', column: 'discussion_guide_link' },
      ]

      for (const { purpose, column } of purposes) {
        const mockBook = {
          id: 1,
          [column]: 'https://drive.google.com/file/d/file-123/view',
        }

        mockBooksService.get.mockResolvedValue(mockBook)

        vi.mocked(mockDriveClient.getFile).mockResolvedValue({
          id: 'file-123',
          name: `${purpose}.pdf`,
          mimeType: 'application/pdf',
          size: '1024',
        })

        const mockStream = new Readable()
        mockStream.push('content')
        mockStream.push(null)

        vi.mocked(mockDriveClient.downloadFile).mockResolvedValue(
          mockStream as any,
        )

        const result = await service.download(1, {
          ...mockParams,
          query: { purpose },
        })

        expect(result.purpose).toBe(purpose)
        expect(result.success).toBe(true)
      }
    })

    it('should handle stream errors gracefully', async () => {
      const mockBook = {
        id: 1,
        cover_file: 'https://drive.google.com/file/d/file-123/view',
      }

      mockBooksService.get.mockResolvedValue(mockBook)

      vi.mocked(mockDriveClient.getFile).mockResolvedValue({
        id: 'file-123',
        name: 'cover.pdf',
        mimeType: 'application/pdf',
        size: '1024',
      })

      const mockStream = new Readable({
        read() {
          // Emit error immediately when read is called
          process.nextTick(() => this.emit('error', new Error('Stream error')))
        },
      })

      vi.mocked(mockDriveClient.downloadFile).mockResolvedValue(
        mockStream as any,
      )

      await expect(
        service.download(1, {
          ...mockParams,
          query: { purpose: 'cover' },
        }),
      ).rejects.toThrow('Stream error')
    })

    it('should handle file size at threshold boundary (10MB)', async () => {
      const mockBook = {
        id: 1,
        cover_file: 'https://drive.google.com/file/d/file-123/view',
      }

      mockBooksService.get.mockResolvedValue(mockBook)

      // Exactly 10MB
      vi.mocked(mockDriveClient.getFile).mockResolvedValue({
        id: 'file-123',
        name: 'boundary.pdf',
        mimeType: 'application/pdf',
        size: '10485760',
      })

      const mockStream = new Readable()
      mockStream.push('content')
      mockStream.push(null)

      vi.mocked(mockDriveClient.downloadFile).mockResolvedValue(
        mockStream as any,
      )

      const result = await service.download(1, {
        ...mockParams,
        query: { purpose: 'cover' },
      })

      // At exactly 10MB, should still download as base64
      expect(result.data).toBeDefined()
      expect(result.url).toBeUndefined()
    })

    it('should handle file size just over threshold', async () => {
      const mockBook = {
        id: 1,
        interior_file: 'https://drive.google.com/file/d/file-123/view',
      }

      mockBooksService.get.mockResolvedValue(mockBook)

      // Just over 10MB
      vi.mocked(mockDriveClient.getFile).mockResolvedValue({
        id: 'file-123',
        name: 'large.pdf',
        mimeType: 'application/pdf',
        size: '10485761',
        webContentLink: 'https://drive.google.com/uc?id=file-123',
      })

      const result = await service.download(1, {
        ...mockParams,
        query: { purpose: 'interior' },
      })

      // Over 10MB, should return URL
      expect(result.url).toBeDefined()
      expect(result.data).toBeUndefined()
    })

    it('should handle empty file', async () => {
      const mockBook = {
        id: 1,
        cover_file: 'https://drive.google.com/file/d/file-123/view',
      }

      mockBooksService.get.mockResolvedValue(mockBook)

      vi.mocked(mockDriveClient.getFile).mockResolvedValue({
        id: 'file-123',
        name: 'empty.pdf',
        mimeType: 'application/pdf',
        size: '0',
      })

      const mockStream = new Readable()
      mockStream.push(null) // Empty stream

      vi.mocked(mockDriveClient.downloadFile).mockResolvedValue(
        mockStream as any,
      )

      const result = await service.download(1, {
        ...mockParams,
        query: { purpose: 'cover' },
      })

      expect(result.success).toBe(true)
      expect(result.data).toBe('') // Empty base64
    })

    it('should propagate Drive client errors', async () => {
      const mockBook = {
        id: 1,
        cover_file: 'https://drive.google.com/file/d/file-123/view',
      }

      mockBooksService.get.mockResolvedValue(mockBook)

      vi.mocked(mockDriveClient.getFile).mockRejectedValue(
        new Error('Drive API error'),
      )

      await expect(
        service.download(1, {
          ...mockParams,
          query: { purpose: 'cover' },
        }),
      ).rejects.toThrow('Drive API error')
    })

    it('should handle book not found', async () => {
      mockBooksService.get.mockRejectedValue(new NotFound('Book not found'))

      await expect(
        service.download(999, {
          ...mockParams,
          query: { purpose: 'cover' },
        }),
      ).rejects.toThrow(NotFound)
    })

    it('should handle multiple chunks in stream', async () => {
      const mockBook = {
        id: 1,
        cover_file: 'https://drive.google.com/file/d/file-123/view',
      }

      mockBooksService.get.mockResolvedValue(mockBook)

      vi.mocked(mockDriveClient.getFile).mockResolvedValue({
        id: 'file-123',
        name: 'multi-chunk.pdf',
        mimeType: 'application/pdf',
        size: '5000',
      })

      const chunks = ['chunk1', 'chunk2', 'chunk3']
      let chunkIndex = 0

      const mockStream = new Readable({
        read() {
          if (chunkIndex < chunks.length) {
            this.push(chunks[chunkIndex++])
          } else {
            this.push(null)
          }
        },
      })

      vi.mocked(mockDriveClient.downloadFile).mockResolvedValue(
        mockStream as any,
      )

      const result = await service.download(1, {
        ...mockParams,
        query: { purpose: 'cover' },
      })

      expect(result.data).toBe(
        Buffer.from('chunk1chunk2chunk3').toString('base64'),
      )
    })
  })

  describe('get', () => {
    it('should return file info without downloading', async () => {
      const mockBook = {
        id: 1,
        cover_file: 'https://drive.google.com/file/d/file-123/view',
      }

      mockBooksService.get.mockResolvedValue(mockBook)

      const result = await service.get('1-cover', {} as Params)

      expect(result).toEqual({
        success: true,
        fileId: 'file-123',
        webViewLink: 'https://drive.google.com/file/d/file-123/view',
        bookId: 1,
        purpose: 'cover',
      })

      // Should not download the file
      expect(mockDriveClient.downloadFile).not.toHaveBeenCalled()
    })

    it('should throw BadRequest for invalid ID format', async () => {
      await expect(service.get('invalid', {} as Params)).rejects.toThrow(
        BadRequest,
      )
    })

    it('should throw NotFound when file does not exist', async () => {
      const mockBook = {
        id: 1,
        cover_file: '',
      }

      mockBooksService.get.mockResolvedValue(mockBook)

      await expect(service.get('1-cover', {} as Params)).rejects.toThrow(
        NotFound,
      )
    })
  })

  describe('find', () => {
    it('should list all files for a book', async () => {
      const mockBook = {
        id: 1,
        cover_file: 'https://drive.google.com/file/d/file-1/view',
        interior_file: 'https://drive.google.com/file/d/file-2/view',
        media_kit_link: '',
        discussion_guide_link: 'https://drive.google.com/file/d/file-3/view',
      }

      mockBooksService.get.mockResolvedValue(mockBook)

      const result = await service.find({
        query: { bookId: 1 },
      } as Params)

      expect(result).toEqual({
        bookId: 1,
        files: [
          {
            purpose: 'cover',
            url: 'https://drive.google.com/file/d/file-1/view',
            fileId: 'file-1',
          },
          {
            purpose: 'interior',
            url: 'https://drive.google.com/file/d/file-2/view',
            fileId: 'file-2',
          },
          {
            purpose: 'discussion_guide',
            url: 'https://drive.google.com/file/d/file-3/view',
            fileId: 'file-3',
          },
        ],
      })
    })

    it('should throw BadRequest when bookId not provided', async () => {
      await expect(service.find({ query: {} } as Params)).rejects.toThrow(
        BadRequest,
      )
    })

    it('should return empty files array when no files exist', async () => {
      const mockBook = {
        id: 1,
        cover_file: '',
        interior_file: '',
        media_kit_link: '',
      }

      mockBooksService.get.mockResolvedValue(mockBook)

      const result = await service.find({
        query: { bookId: 1 },
      } as Params)

      expect(result).toEqual({
        bookId: 1,
        files: [],
      })
    })
  })
})
