import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { FileOperationsService } from '../../../src/services/file-operations/file-operations.class'
import type { Application } from '../../../src/declarations'
import type { Params } from '@feathersjs/feathers'
import { GoogleDriveManager } from '../../../src/utils/google-drive-manager'
import { GoogleDriveClient } from '../../../src/utils/google-drive-client'
import { BadRequest, NotFound } from '@feathersjs/errors'

// Mock dependencies
vi.mock('../../../src/utils/google-drive-manager')
vi.mock('../../../src/utils/google-drive-client')
vi.mock('../../../src/logger')

describe('FileOperationsService - Upload', () => {
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
            chunkedThreshold: 10485760,
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
      createBookFolderStructure: vi.fn(),
      listFiles: vi.fn(),
      createFolder: vi.fn(),
      uploadFile: vi.fn(),
      getFile: vi.fn(),
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

  describe('upload', () => {
    const mockBook = {
      id: 1,
      title: 'Test Book',
      drive_folder_id: null,
    }

    const mockParams: Params = {
      user: {
        id: 123,
        email: 'test@example.com',
      },
    }

    it('should upload a file successfully with existing book folder', async () => {
      const uploadData = {
        bookId: 1,
        purpose: 'cover',
        file: {
          name: 'cover.pdf',
          type: 'application/pdf',
          size: 1024,
          data: Buffer.from('test content').toString('base64'),
        },
      }

      const bookWithFolder = { ...mockBook, drive_folder_id: 'folder-123' }

      mockBooksService.get.mockResolvedValue(bookWithFolder)
      vi.mocked(mockDriveClient.listFiles).mockResolvedValue({
        files: [{ id: 'subfolder-123', name: 'cover' }],
        nextPageToken: undefined,
      })

      vi.mocked(mockDriveClient.uploadFile).mockResolvedValue({
        id: 'file-123',
        name: 'cover.pdf',
        mimeType: 'application/pdf',
        webViewLink: 'https://drive.google.com/file/d/file-123/view',
        webContentLink: 'https://drive.google.com/uc?id=file-123',
      })

      const result = await service.upload(uploadData, mockParams)

      expect(result).toEqual({
        success: true,
        fileId: 'file-123',
        fileName: 'cover.pdf',
        webViewLink: 'https://drive.google.com/file/d/file-123/view',
        webContentLink: 'https://drive.google.com/uc?id=file-123',
        bookId: 1,
        purpose: 'cover',
      })

      expect(mockBooksService.patch).toHaveBeenCalledWith(1, {
        cover_file: 'https://drive.google.com/file/d/file-123/view',
      })
    })

    it('should create book folder if it does not exist', async () => {
      const uploadData = {
        bookId: 1,
        purpose: 'cover',
        file: {
          name: 'cover.pdf',
          type: 'application/pdf',
          size: 1024,
          data: Buffer.from('test content').toString('base64'),
        },
      }

      mockBooksService.get.mockResolvedValue(mockBook)

      vi.mocked(mockDriveClient.createBookFolderStructure).mockResolvedValue({
        folderId: 'new-folder-123',
        subfolders: {},
      })

      vi.mocked(mockDriveClient.listFiles).mockResolvedValue({
        files: [],
        nextPageToken: undefined,
      })

      vi.mocked(mockDriveClient.createFolder).mockResolvedValue({
        id: 'subfolder-123',
        name: 'cover',
        mimeType: 'application/vnd.google-apps.folder',
      })

      vi.mocked(mockDriveClient.uploadFile).mockResolvedValue({
        id: 'file-123',
        name: 'cover.pdf',
        mimeType: 'application/pdf',
        webViewLink: 'https://drive.google.com/file/d/file-123/view',
      })

      await service.upload(uploadData, mockParams)

      expect(mockDriveClient.createBookFolderStructure).toHaveBeenCalledWith(
        1,
        'Test Book',
      )

      expect(mockBooksService.patch).toHaveBeenCalledWith(1, {
        drive_folder_id: 'new-folder-123',
      })
    })

    it('should create purpose subfolder if it does not exist', async () => {
      const uploadData = {
        bookId: 1,
        purpose: 'interior',
        file: {
          name: 'interior.pdf',
          type: 'application/pdf',
          size: 1024,
          data: Buffer.from('test content').toString('base64'),
        },
      }

      const bookWithFolder = { ...mockBook, drive_folder_id: 'folder-123' }
      mockBooksService.get.mockResolvedValue(bookWithFolder)

      vi.mocked(mockDriveClient.listFiles).mockResolvedValue({
        files: [], // No existing subfolder
        nextPageToken: undefined,
      })

      vi.mocked(mockDriveClient.createFolder).mockResolvedValue({
        id: 'new-subfolder-123',
        name: 'interior',
        mimeType: 'application/vnd.google-apps.folder',
      })

      vi.mocked(mockDriveClient.uploadFile).mockResolvedValue({
        id: 'file-123',
        name: 'interior.pdf',
        mimeType: 'application/pdf',
        webViewLink: 'https://drive.google.com/file/d/file-123/view',
      })

      await service.upload(uploadData, mockParams)

      expect(mockDriveClient.createFolder).toHaveBeenCalledWith({
        name: 'interior',
        parentId: 'folder-123',
        description: 'interior files for Test Book',
      })

      expect(mockDriveClient.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          folderId: 'new-subfolder-123',
        }),
      )
    })

    it('should throw BadRequest for invalid purpose', async () => {
      const uploadData = {
        bookId: 1,
        purpose: 'invalid-purpose',
        file: {
          name: 'file.pdf',
          type: 'application/pdf',
          size: 1024,
          data: Buffer.from('test').toString('base64'),
        },
      }

      await expect(service.upload(uploadData, mockParams)).rejects.toThrow(
        BadRequest,
      )
    })

    it('should handle different file purposes correctly', async () => {
      const purposes = [
        { purpose: 'cover', column: 'cover_file' },
        { purpose: 'interior', column: 'interior_file' },
        { purpose: 'marketing', column: 'media_kit_link' },
        { purpose: 'media_kit', column: 'media_kit_link' },
        { purpose: 'discussion_guide', column: 'discussion_guide_link' },
      ]

      const bookWithFolder = { ...mockBook, drive_folder_id: 'folder-123' }
      mockBooksService.get.mockResolvedValue(bookWithFolder)

      vi.mocked(mockDriveClient.listFiles).mockResolvedValue({
        files: [],
      })

      vi.mocked(mockDriveClient.createFolder).mockResolvedValue({
        id: 'subfolder-123',
        name: 'test',
        mimeType: 'application/vnd.google-apps.folder',
      })

      vi.mocked(mockDriveClient.uploadFile).mockResolvedValue({
        id: 'file-123',
        name: 'test.pdf',
        mimeType: 'application/pdf',
        webViewLink: 'https://drive.google.com/file/d/file-123/view',
      })

      for (const { purpose, column } of purposes) {
        mockBooksService.patch.mockClear()

        const uploadData = {
          bookId: 1,
          purpose,
          file: {
            name: `${purpose}.pdf`,
            type: 'application/pdf',
            size: 1024,
            data: Buffer.from('test').toString('base64'),
          },
        }

        await service.upload(uploadData, mockParams)

        expect(mockBooksService.patch).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            [column]: expect.any(String),
          }),
        )
      }
    })

    it('should decode base64 file data correctly', async () => {
      const uploadData = {
        bookId: 1,
        purpose: 'cover',
        file: {
          name: 'cover.pdf',
          type: 'application/pdf',
          size: 12,
          data: Buffer.from('test content').toString('base64'),
        },
      }

      const bookWithFolder = { ...mockBook, drive_folder_id: 'folder-123' }
      mockBooksService.get.mockResolvedValue(bookWithFolder)

      vi.mocked(mockDriveClient.listFiles).mockResolvedValue({
        files: [{ id: 'subfolder-123', name: 'cover' }],
      })

      vi.mocked(mockDriveClient.uploadFile).mockImplementation(
        async (options) => {
          // Verify the file content is properly decoded
          expect(options.fileContent).toBeDefined()
          return {
            id: 'file-123',
            name: 'cover.pdf',
            mimeType: 'application/pdf',
            webViewLink: 'https://drive.google.com/file/d/file-123/view',
          }
        },
      )

      await service.upload(uploadData, mockParams)

      expect(mockDriveClient.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'cover.pdf',
          mimeType: 'application/pdf',
        }),
      )
    })

    it('should propagate errors from Drive client', async () => {
      const uploadData = {
        bookId: 1,
        purpose: 'cover',
        file: {
          name: 'cover.pdf',
          type: 'application/pdf',
          size: 1024,
          data: Buffer.from('test').toString('base64'),
        },
      }

      mockBooksService.get.mockResolvedValue({
        ...mockBook,
        drive_folder_id: 'folder-123',
      })

      vi.mocked(mockDriveClient.listFiles).mockResolvedValue({
        files: [{ id: 'subfolder-123', name: 'cover' }],
      })

      vi.mocked(mockDriveClient.uploadFile).mockRejectedValue(
        new Error('Upload failed'),
      )

      await expect(service.upload(uploadData, mockParams)).rejects.toThrow(
        'Upload failed',
      )
    })

    it('should handle book not found error', async () => {
      const uploadData = {
        bookId: 999,
        purpose: 'cover',
        file: {
          name: 'cover.pdf',
          type: 'application/pdf',
          size: 1024,
          data: Buffer.from('test').toString('base64'),
        },
      }

      mockBooksService.get.mockRejectedValue(new NotFound('Book not found'))

      await expect(service.upload(uploadData, mockParams)).rejects.toThrow(
        NotFound,
      )
    })
  })

  describe('create', () => {
    it('should delegate to upload method', async () => {
      const uploadData = {
        bookId: 1,
        purpose: 'cover',
        file: {
          name: 'cover.pdf',
          type: 'application/pdf',
          size: 1024,
          data: Buffer.from('test').toString('base64'),
        },
      }

      const mockParams: Params = {
        user: { id: 123, email: 'test@example.com' },
      }

      mockBooksService.get.mockResolvedValue({
        id: 1,
        title: 'Test Book',
        drive_folder_id: 'folder-123',
      })

      vi.mocked(mockDriveClient.listFiles).mockResolvedValue({
        files: [{ id: 'subfolder-123', name: 'cover' }],
      })

      vi.mocked(mockDriveClient.uploadFile).mockResolvedValue({
        id: 'file-123',
        name: 'cover.pdf',
        mimeType: 'application/pdf',
        webViewLink: 'https://drive.google.com/file/d/file-123/view',
      })

      const result = await service.create(uploadData, mockParams)

      expect(result.success).toBe(true)
      expect(result.fileId).toBe('file-123')
    })
  })

  describe('edge cases', () => {
    const mockParams: Params = {
      user: { id: 123, email: 'test@example.com' },
    }

    it('should handle empty file data', async () => {
      const uploadData = {
        bookId: 1,
        purpose: 'cover',
        file: {
          name: 'empty.pdf',
          type: 'application/pdf',
          size: 0,
          data: '',
        },
      }

      mockBooksService.get.mockResolvedValue({
        id: 1,
        title: 'Test Book',
        drive_folder_id: 'folder-123',
      })

      vi.mocked(mockDriveClient.listFiles).mockResolvedValue({
        files: [{ id: 'subfolder-123', name: 'cover' }],
      })

      vi.mocked(mockDriveClient.uploadFile).mockResolvedValue({
        id: 'file-123',
        name: 'empty.pdf',
        mimeType: 'application/pdf',
        webViewLink: 'https://drive.google.com/file/d/file-123/view',
      })

      const result = await service.upload(uploadData, mockParams)

      expect(result.success).toBe(true)
    })

    it('should handle special characters in book title', async () => {
      const uploadData = {
        bookId: 1,
        purpose: 'cover',
        file: {
          name: 'cover.pdf',
          type: 'application/pdf',
          size: 1024,
          data: Buffer.from('test').toString('base64'),
        },
      }

      mockBooksService.get.mockResolvedValue({
        id: 1,
        title: 'Test: Book / With * Special | Characters',
        drive_folder_id: null,
      })

      vi.mocked(mockDriveClient.createBookFolderStructure).mockResolvedValue({
        folderId: 'folder-123',
        subfolders: {},
      })

      vi.mocked(mockDriveClient.listFiles).mockResolvedValue({
        files: [{ id: 'subfolder-123', name: 'cover' }],
      })

      vi.mocked(mockDriveClient.uploadFile).mockResolvedValue({
        id: 'file-123',
        name: 'cover.pdf',
        mimeType: 'application/pdf',
        webViewLink: 'https://drive.google.com/file/d/file-123/view',
      })

      const result = await service.upload(uploadData, mockParams)

      expect(result.success).toBe(true)
      expect(mockDriveClient.createBookFolderStructure).toHaveBeenCalledWith(
        1,
        'Test: Book / With * Special | Characters',
      )
    })

    it('should handle various MIME types', async () => {
      const mimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ]

      mockBooksService.get.mockResolvedValue({
        id: 1,
        title: 'Test Book',
        drive_folder_id: 'folder-123',
      })

      vi.mocked(mockDriveClient.listFiles).mockResolvedValue({
        files: [{ id: 'subfolder-123', name: 'cover' }],
      })

      for (const mimeType of mimeTypes) {
        vi.mocked(mockDriveClient.uploadFile).mockResolvedValue({
          id: 'file-123',
          name: 'test-file',
          mimeType: mimeType,
          webViewLink: 'https://drive.google.com/file/d/file-123/view',
        })

        const uploadData = {
          bookId: 1,
          purpose: 'cover',
          file: {
            name: 'test-file',
            type: mimeType,
            size: 1024,
            data: Buffer.from('test').toString('base64'),
          },
        }

        const result = await service.upload(uploadData, mockParams)
        expect(result.success).toBe(true)
      }
    })
  })
})
