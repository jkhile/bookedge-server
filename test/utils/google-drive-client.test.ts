import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { GoogleDriveClient } from '../../src/utils/google-drive-client'
import { google } from 'googleapis'
import { GeneralError } from '@feathersjs/errors'
import type { OAuth2Client } from 'google-auth-library'
import axios from 'axios'

// Mock the dependencies
vi.mock('googleapis')
vi.mock('axios')
vi.mock('../../src/logger')

describe('GoogleDriveClient', () => {
  let mockAuth: OAuth2Client
  let mockDrive: any
  let client: GoogleDriveClient

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Create mock OAuth2Client
    mockAuth = {
      getAccessToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
    } as any

    // Create mock Drive API
    mockDrive = {
      files: {
        create: vi.fn(),
        get: vi.fn(),
        list: vi.fn(),
        delete: vi.fn(),
        update: vi.fn(),
      },
    }

    // Mock google.drive to return our mock
    vi.mocked(google.drive).mockReturnValue(mockDrive)

    // Create client instance
    client = new GoogleDriveClient(mockAuth, 'test-drive-id')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with auth and shared drive ID', () => {
      expect(client).toBeDefined()
      expect(client.getSharedDriveId()).toBe('test-drive-id')
    })

    it('should initialize without shared drive ID', () => {
      const clientWithoutDrive = new GoogleDriveClient(mockAuth)
      expect(clientWithoutDrive.getSharedDriveId()).toBeUndefined()
    })
  })

  describe('createServiceAccountClient', () => {
    beforeEach(() => {
      // Mock environment variables
      process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT = JSON.stringify({
        client_email: 'test@example.com',
        private_key: 'test-key',
      })
      process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID = 'shared-drive-123'
    })

    afterEach(() => {
      delete process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT
      delete process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID
      delete process.env.GOOGLE_WORKSPACE_IMPERSONATE_EMAIL
    })

    it('should create service account client successfully', async () => {
      const mockJWT = {
        authorize: vi.fn().mockResolvedValue(undefined),
      }

      vi.mocked(google.auth.JWT).mockReturnValue(mockJWT as any)

      const client = await GoogleDriveClient.createServiceAccountClient()

      expect(client).toBeInstanceOf(GoogleDriveClient)
      expect(mockJWT.authorize).toHaveBeenCalled()
    })

    it('should throw error when service account credentials not configured', async () => {
      delete process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT

      await expect(
        GoogleDriveClient.createServiceAccountClient(),
      ).rejects.toThrow(GeneralError)
    })

    it('should throw error when shared drive ID not configured', async () => {
      delete process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID

      await expect(
        GoogleDriveClient.createServiceAccountClient(),
      ).rejects.toThrow(GeneralError)
    })

    it('should handle impersonation when email is configured', async () => {
      process.env.GOOGLE_WORKSPACE_IMPERSONATE_EMAIL = 'impersonate@example.com'

      const mockJWT = {
        authorize: vi.fn().mockResolvedValue(undefined),
      }

      const jwtSpy = vi.mocked(google.auth.JWT).mockReturnValue(mockJWT as any)

      await GoogleDriveClient.createServiceAccountClient()

      expect(jwtSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'impersonate@example.com',
        }),
      )
    })
  })

  describe('createUserClient', () => {
    it('should create user client with access token', async () => {
      const mockOAuth2 = {
        setCredentials: vi.fn(),
      }

      vi.mocked(google.auth.OAuth2).mockReturnValue(mockOAuth2 as any)

      const client = await GoogleDriveClient.createUserClient('test-token')

      expect(client).toBeInstanceOf(GoogleDriveClient)
      expect(mockOAuth2.setCredentials).toHaveBeenCalledWith({
        access_token: 'test-token',
        scope: 'https://www.googleapis.com/auth/drive.file',
      })
    })
  })

  describe('createFolder', () => {
    it('should create a folder successfully', async () => {
      const mockResponse = {
        status: 200,
        data: {
          id: 'folder-123',
          name: 'Test Folder',
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['parent-123'],
          createdTime: '2024-01-01T00:00:00Z',
          modifiedTime: '2024-01-01T00:00:00Z',
        },
      }

      mockDrive.files.create.mockResolvedValue(mockResponse)

      const result = await client.createFolder({
        name: 'Test Folder',
        parentId: 'parent-123',
        description: 'Test description',
      })

      expect(result).toEqual({
        id: 'folder-123',
        name: 'Test Folder',
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['parent-123'],
        createdTime: '2024-01-01T00:00:00Z',
        modifiedTime: '2024-01-01T00:00:00Z',
      })

      expect(mockDrive.files.create).toHaveBeenCalledWith({
        requestBody: {
          name: 'Test Folder',
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['parent-123'],
          description: 'Test description',
        },
        fields: 'id, name, mimeType, parents, createdTime, modifiedTime',
        supportsAllDrives: true,
      })
    })

    it('should use shared drive as parent when no parent specified', async () => {
      const mockResponse = {
        status: 200,
        data: {
          id: 'folder-123',
          name: 'Test Folder',
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['test-drive-id'],
        },
      }

      mockDrive.files.create.mockResolvedValue(mockResponse)

      await client.createFolder({
        name: 'Test Folder',
      })

      expect(mockDrive.files.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            parents: ['test-drive-id'],
          }),
        }),
      )
    })

    it('should throw error when folder creation fails', async () => {
      mockDrive.files.create.mockRejectedValue(new Error('API Error'))

      await expect(
        client.createFolder({ name: 'Test Folder' }),
      ).rejects.toThrow(GeneralError)
    })

    it('should throw error when no ID returned', async () => {
      mockDrive.files.create.mockResolvedValue({
        status: 200,
        data: { name: 'Test Folder' },
      })

      await expect(
        client.createFolder({ name: 'Test Folder' }),
      ).rejects.toThrow(GeneralError)
    })
  })

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      const mockResponse = {
        status: 200,
        data: {
          id: 'file-123',
          name: 'test.pdf',
          mimeType: 'application/pdf',
          size: '1024',
          parents: ['folder-123'],
          createdTime: '2024-01-01T00:00:00Z',
          modifiedTime: '2024-01-01T00:00:00Z',
          webViewLink: 'https://drive.google.com/file/d/file-123/view',
          webContentLink: 'https://drive.google.com/uc?id=file-123',
        },
      }

      mockDrive.files.create.mockResolvedValue(mockResponse)

      const fileBuffer = Buffer.from('test content')
      const result = await client.uploadFile({
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        folderId: 'folder-123',
        fileContent: fileBuffer,
        description: 'Test file',
      })

      expect(result).toEqual({
        id: 'file-123',
        name: 'test.pdf',
        mimeType: 'application/pdf',
        size: '1024',
        parents: ['folder-123'],
        createdTime: '2024-01-01T00:00:00Z',
        modifiedTime: '2024-01-01T00:00:00Z',
        webViewLink: 'https://drive.google.com/file/d/file-123/view',
        webContentLink: 'https://drive.google.com/uc?id=file-123',
        thumbnailLink: undefined,
      })

      expect(mockDrive.files.create).toHaveBeenCalledWith({
        requestBody: {
          name: 'test.pdf',
          parents: ['folder-123'],
          description: 'Test file',
        },
        media: {
          mimeType: 'application/pdf',
          body: fileBuffer,
        },
        fields:
          'id, name, mimeType, size, parents, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink',
        supportsAllDrives: true,
      })
    })

    it('should throw error when upload fails', async () => {
      mockDrive.files.create.mockRejectedValue(new Error('Upload failed'))

      const fileBuffer = Buffer.from('test content')

      await expect(
        client.uploadFile({
          fileName: 'test.pdf',
          mimeType: 'application/pdf',
          folderId: 'folder-123',
          fileContent: fileBuffer,
        }),
      ).rejects.toThrow(GeneralError)
    })
  })

  describe('initiateResumableUpload', () => {
    it('should initiate resumable upload successfully', async () => {
      const mockResponse = {
        headers: {
          location: 'https://www.googleapis.com/upload/drive/v3/files/session',
        },
      }

      vi.mocked(axios.post).mockResolvedValue(mockResponse)

      const sessionUri = await client.initiateResumableUpload({
        fileName: 'large-file.pdf',
        mimeType: 'application/pdf',
        folderId: 'folder-123',
        fileSize: 10000000,
        description: 'Large file',
      })

      expect(sessionUri).toBe(
        'https://www.googleapis.com/upload/drive/v3/files/session',
      )

      expect(axios.post).toHaveBeenCalledWith(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true',
        {
          name: 'large-file.pdf',
          parents: ['folder-123'],
          description: 'Large file',
        },
        {
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Type': 'application/pdf',
            'X-Upload-Content-Length': '10000000',
          },
        },
      )
    })

    it('should throw error when session URI not returned', async () => {
      vi.mocked(axios.post).mockResolvedValue({ headers: {} })

      await expect(
        client.initiateResumableUpload({
          fileName: 'test.pdf',
          mimeType: 'application/pdf',
          folderId: 'folder-123',
          fileSize: 1000,
        }),
      ).rejects.toThrow(GeneralError)
    })
  })

  describe('uploadChunkToSession', () => {
    const sessionUri = 'https://www.googleapis.com/upload/session'

    it('should upload chunk and return progress for incomplete upload', async () => {
      const mockResponse = {
        status: 308,
        data: {},
      }

      vi.mocked(axios.put).mockResolvedValue(mockResponse)

      const chunkData = Buffer.alloc(1048576) // 1MB
      const result = await client.uploadChunkToSession(
        sessionUri,
        chunkData,
        0,
        5242880,
      ) // 5MB total

      expect(result).toEqual({
        complete: false,
        progress: 20, // 1MB of 5MB
      })

      expect(axios.put).toHaveBeenCalledWith(sessionUri, chunkData, {
        headers: {
          'Content-Length': '1048576',
          'Content-Range': 'bytes 0-1048575/5242880',
        },
        validateStatus: expect.any(Function),
      })
    })

    it('should upload chunk and return file ID when complete', async () => {
      const mockResponse = {
        status: 200,
        data: { id: 'file-123' },
      }

      vi.mocked(axios.put).mockResolvedValue(mockResponse)

      const chunkData = Buffer.alloc(1000)
      const result = await client.uploadChunkToSession(
        sessionUri,
        chunkData,
        0,
        1000,
      )

      expect(result).toEqual({
        complete: true,
        fileId: 'file-123',
        progress: 100,
      })
    })

    it('should throw error on upload failure', async () => {
      vi.mocked(axios.put).mockRejectedValue(new Error('Upload failed'))

      const chunkData = Buffer.alloc(1000)

      await expect(
        client.uploadChunkToSession(sessionUri, chunkData, 0, 1000),
      ).rejects.toThrow()
    })
  })

  describe('getResumableUploadStatus', () => {
    const sessionUri = 'https://www.googleapis.com/upload/session'

    it('should return bytes uploaded from Range header', async () => {
      const mockResponse = {
        status: 308,
        headers: {
          range: 'bytes=0-1048575',
        },
      }

      vi.mocked(axios.put).mockResolvedValue(mockResponse)

      const bytesUploaded = await client.getResumableUploadStatus(
        sessionUri,
        5242880,
      )

      expect(bytesUploaded).toBe(1048576) // Last byte + 1
    })

    it('should return total size when upload complete', async () => {
      const mockResponse = {
        status: 200,
      }

      vi.mocked(axios.put).mockResolvedValue(mockResponse)

      const bytesUploaded = await client.getResumableUploadStatus(
        sessionUri,
        5242880,
      )

      expect(bytesUploaded).toBe(5242880)
    })

    it('should return 0 when no Range header present', async () => {
      const mockResponse = {
        status: 308,
        headers: {},
      }

      vi.mocked(axios.put).mockResolvedValue(mockResponse)

      const bytesUploaded = await client.getResumableUploadStatus(
        sessionUri,
        5242880,
      )

      expect(bytesUploaded).toBe(0)
    })
  })

  describe('getFile', () => {
    it('should get file metadata successfully', async () => {
      const mockResponse = {
        data: {
          id: 'file-123',
          name: 'test.pdf',
          mimeType: 'application/pdf',
          size: '1024',
          parents: ['folder-123'],
          createdTime: '2024-01-01T00:00:00Z',
          modifiedTime: '2024-01-01T00:00:00Z',
          webViewLink: 'https://drive.google.com/file/d/file-123/view',
        },
      }

      mockDrive.files.get.mockResolvedValue(mockResponse)

      const result = await client.getFile('file-123')

      expect(result).toEqual({
        id: 'file-123',
        name: 'test.pdf',
        mimeType: 'application/pdf',
        size: '1024',
        parents: ['folder-123'],
        createdTime: '2024-01-01T00:00:00Z',
        modifiedTime: '2024-01-01T00:00:00Z',
        webViewLink: 'https://drive.google.com/file/d/file-123/view',
        webContentLink: undefined,
        thumbnailLink: undefined,
      })

      expect(mockDrive.files.get).toHaveBeenCalledWith({
        fileId: 'file-123',
        fields:
          'id, name, mimeType, size, parents, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink',
        supportsAllDrives: true,
      })
    })

    it('should throw error when file not found', async () => {
      mockDrive.files.get.mockResolvedValue({ data: {} })

      await expect(client.getFile('file-123')).rejects.toThrow(GeneralError)
    })
  })

  describe('listFiles', () => {
    it('should list files successfully', async () => {
      const mockResponse = {
        data: {
          files: [
            {
              id: 'file-1',
              name: 'file1.pdf',
              mimeType: 'application/pdf',
              size: '1024',
            },
            {
              id: 'file-2',
              name: 'file2.pdf',
              mimeType: 'application/pdf',
              size: '2048',
            },
          ],
          nextPageToken: 'next-token',
        },
      }

      mockDrive.files.list.mockResolvedValue(mockResponse)

      const result = await client.listFiles({
        folderId: 'folder-123',
        pageSize: 10,
      })

      expect(result.files).toHaveLength(2)
      expect(result.nextPageToken).toBe('next-token')

      expect(mockDrive.files.list).toHaveBeenCalledWith(
        expect.objectContaining({
          q: "trashed = false and 'folder-123' in parents",
          pageSize: 10,
          supportsAllDrives: true,
        }),
      )
    })

    it('should use shared drive when no folder specified', async () => {
      mockDrive.files.list.mockResolvedValue({ data: { files: [] } })

      await client.listFiles()

      expect(mockDrive.files.list).toHaveBeenCalledWith(
        expect.objectContaining({
          q: "trashed = false and 'test-drive-id' in parents",
          driveId: 'test-drive-id',
          corpora: 'drive',
        }),
      )
    })

    it('should apply custom query filter', async () => {
      mockDrive.files.list.mockResolvedValue({ data: { files: [] } })

      await client.listFiles({
        folderId: 'folder-123',
        query: "mimeType='application/pdf'",
      })

      expect(mockDrive.files.list).toHaveBeenCalledWith(
        expect.objectContaining({
          q: "trashed = false and 'folder-123' in parents and mimeType='application/pdf'",
        }),
      )
    })
  })

  describe('downloadFile', () => {
    it('should download file as stream', async () => {
      const mockStream = {
        on: vi.fn(),
        pipe: vi.fn(),
      }

      mockDrive.files.get.mockResolvedValue({ data: mockStream })

      const stream = await client.downloadFile('file-123')

      expect(stream).toBe(mockStream)

      expect(mockDrive.files.get).toHaveBeenCalledWith(
        {
          fileId: 'file-123',
          alt: 'media',
          supportsAllDrives: true,
        },
        {
          responseType: 'stream',
        },
      )
    })

    it('should throw error when download fails', async () => {
      mockDrive.files.get.mockRejectedValue(new Error('Download failed'))

      await expect(client.downloadFile('file-123')).rejects.toThrow(
        GeneralError,
      )
    })
  })

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      mockDrive.files.delete.mockResolvedValue({ status: 204 })

      await client.deleteFile('file-123')

      expect(mockDrive.files.delete).toHaveBeenCalledWith({
        fileId: 'file-123',
        supportsAllDrives: true,
      })
    })

    it('should throw error when deletion fails', async () => {
      mockDrive.files.delete.mockRejectedValue(new Error('Delete failed'))

      await expect(client.deleteFile('file-123')).rejects.toThrow(GeneralError)
    })
  })

  describe('moveFile', () => {
    it('should move file to new folder successfully', async () => {
      const mockGetResponse = {
        data: {
          id: 'file-123',
          name: 'test.pdf',
          mimeType: 'application/pdf',
          parents: ['old-folder'],
        },
      }

      const mockUpdateResponse = {
        data: {
          id: 'file-123',
          name: 'test.pdf',
          mimeType: 'application/pdf',
          size: '1024',
          parents: ['new-folder'],
          createdTime: '2024-01-01T00:00:00Z',
          modifiedTime: '2024-01-01T00:00:00Z',
        },
      }

      mockDrive.files.get.mockResolvedValue(mockGetResponse)
      mockDrive.files.update.mockResolvedValue(mockUpdateResponse)

      const result = await client.moveFile('file-123', 'new-folder')

      expect(result.parents).toEqual(['new-folder'])

      expect(mockDrive.files.update).toHaveBeenCalledWith({
        fileId: 'file-123',
        addParents: 'new-folder',
        removeParents: 'old-folder',
        fields: 'id, name, mimeType, size, parents, createdTime, modifiedTime',
        supportsAllDrives: true,
      })
    })

    it('should throw error when move fails', async () => {
      mockDrive.files.get.mockRejectedValue(new Error('Get failed'))

      await expect(client.moveFile('file-123', 'new-folder')).rejects.toThrow(
        GeneralError,
      )
    })
  })

  describe('createBookFolderStructure', () => {
    it('should create book folder in shared drive root', async () => {
      const mockFolderResponse = {
        status: 200,
        data: {
          id: 'book-folder-123',
          name: '1-Test Book',
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['test-drive-id'],
        },
      }

      mockDrive.files.create.mockResolvedValue(mockFolderResponse)

      const result = await client.createBookFolderStructure(1, 'Test Book')

      expect(result).toEqual({
        folderId: 'book-folder-123',
        subfolders: {},
      })

      expect(mockDrive.files.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            name: '1-Test Book',
            description: 'Files for book: Test Book (ID: 1)',
          }),
        }),
      )
    })

    it('should sanitize book title for folder name', async () => {
      const mockFolderResponse = {
        status: 200,
        data: {
          id: 'book-folder-123',
          name: '1-Test__Book',
          mimeType: 'application/vnd.google-apps.folder',
        },
      }

      mockDrive.files.create.mockResolvedValue(mockFolderResponse)

      await client.createBookFolderStructure(1, 'Test: Book / Title')

      expect(mockDrive.files.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            name: '1-Test_ Book _ Title',
          }),
        }),
      )
    })

    it('should throw error when folder creation fails', async () => {
      mockDrive.files.create.mockRejectedValue(new Error('Creation failed'))

      await expect(
        client.createBookFolderStructure(1, 'Test Book'),
      ).rejects.toThrow(GeneralError)
    })
  })
})
