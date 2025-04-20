import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  GoogleDriveService,
  useGoogleDrive,
} from '../../src/utils/google-drive-service'

// Mock google.drive
vi.mock('googleapis', () => {
  const mockDrive = {
    files: {
      list: vi.fn(),
      create: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    permissions: {
      create: vi.fn(),
    },
  }

  return {
    google: {
      drive: vi.fn().mockReturnValue(mockDrive),
      auth: {
        OAuth2: vi.fn(),
        JWT: vi.fn().mockImplementation(() => ({})),
      },
    },
  }
})

// Mock fs
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(
    JSON.stringify({
      client_email: 'test@example.com',
      private_key: 'mock-key',
    }),
  ),
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
}))

// Mock environment variables
vi.mock('../../src/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

describe('GoogleDriveService', () => {
  let service: GoogleDriveService
  let mockDrive: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Set environment variables
    process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT = JSON.stringify({
      client_email: 'test@example.com',
      private_key: 'mock-key',
    })
    process.env.GOOGLE_DRIVE_ROOT_FOLDER = 'TestBookEdge'
    process.env.GOOGLE_WORKSPACE_DOMAIN = 'test.example.com'

    // Create a new service with mock config
    service = new GoogleDriveService({
      credentials: JSON.stringify({
        client_email: 'test@example.com',
        private_key: 'mock-key',
      }),
      rootFolderName: 'TestBookEdge',
      workspaceDomain: 'test.example.com',
    })

    // Get the mock drive instance
    mockDrive = (service as any).drive = {
      files: {
        list: vi.fn(),
        create: vi.fn(),
        get: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      permissions: {
        create: vi.fn(),
      },
    }

    // Mock root folder ID
    ;(service as any).rootFolderId = 'root-folder-id'
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createFolder', () => {
    it('should create a folder successfully', async () => {
      // Mock checking if folder exists
      mockDrive.files.list.mockResolvedValueOnce({
        data: { files: [] },
      })

      // Mock folder creation
      mockDrive.files.create.mockResolvedValueOnce({
        data: {
          id: 'new-folder-id',
          name: 'Test Folder',
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['parent-id'],
        },
      })

      const result = await service.createFolder('Test Folder', 'parent-id')

      expect(mockDrive.files.list).toHaveBeenCalledWith({
        q: "mimeType='application/vnd.google-apps.folder' and name='Test Folder' and 'parent-id' in parents and trashed=false",
        fields: 'nextPageToken, files(id, name, mimeType, parents)',
        pageSize: 1000,
        orderBy: 'modifiedTime desc',
      })

      expect(mockDrive.files.create).toHaveBeenCalledWith({
        requestBody: {
          name: 'Test Folder',
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['parent-id'],
        },
        fields: 'id, name, mimeType, parents',
      })

      expect(result).toEqual({
        id: 'new-folder-id',
        name: 'Test Folder',
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['parent-id'],
      })
    })

    it('should return existing folder if it already exists', async () => {
      // Mock finding existing folder
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [
            {
              id: 'existing-folder-id',
              name: 'Test Folder',
              mimeType: 'application/vnd.google-apps.folder',
              parents: ['parent-id'],
            },
          ],
        },
      })

      const result = await service.createFolder('Test Folder', 'parent-id')

      expect(mockDrive.files.create).not.toHaveBeenCalled()
      expect(result).toEqual({
        id: 'existing-folder-id',
        name: 'Test Folder',
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['parent-id'],
      })
    })
  })

  describe('listFiles', () => {
    it('should list files in a folder', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [
            {
              id: 'file-1',
              name: 'File 1',
              mimeType: 'application/pdf',
              webViewLink: 'https://example.com/1',
              thumbnailLink: 'https://example.com/thumb/1',
            },
            {
              id: 'folder-1',
              name: 'Folder 1',
              mimeType: 'application/vnd.google-apps.folder',
            },
          ],
        },
      })

      const result = await service.listFiles('folder-id')

      expect(mockDrive.files.list).toHaveBeenCalledWith({
        q: "'folder-id' in parents and trashed=false",
        fields:
          'nextPageToken, files(id, name, mimeType, webViewLink, thumbnailLink, webContentLink, modifiedTime, size)',
        pageSize: 1000,
        orderBy: 'modifiedTime desc',
      })

      expect(result).toEqual([
        {
          id: 'file-1',
          name: 'File 1',
          mimeType: 'application/pdf',
          webViewLink: 'https://example.com/1',
          thumbnailLink: 'https://example.com/thumb/1',
        },
        {
          id: 'folder-1',
          name: 'Folder 1',
          mimeType: 'application/vnd.google-apps.folder',
        },
      ])
    })
  })

  describe('getFile', () => {
    it('should get file metadata', async () => {
      mockDrive.files.get.mockResolvedValueOnce({
        data: {
          id: 'file-id',
          name: 'Test File',
          mimeType: 'application/pdf',
          webViewLink: 'https://example.com/view',
          thumbnailLink: 'https://example.com/thumb',
          modifiedTime: '2025-01-01T00:00:00Z',
          size: '1234',
          parents: ['parent-id'],
          description: 'Test description',
        },
      })

      const result = await service.getFile('file-id')

      expect(mockDrive.files.get).toHaveBeenCalledWith({
        fileId: 'file-id',
        fields:
          'id, name, mimeType, webViewLink, thumbnailLink, webContentLink, modifiedTime, size, parents, description',
      })

      expect(result).toEqual({
        id: 'file-id',
        name: 'Test File',
        mimeType: 'application/pdf',
        webViewLink: 'https://example.com/view',
        thumbnailLink: 'https://example.com/thumb',
        modifiedTime: '2025-01-01T00:00:00Z',
        size: '1234',
        parents: ['parent-id'],
        description: 'Test description',
      })
    })
  })

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      mockDrive.files.delete.mockResolvedValueOnce({})

      const result = await service.deleteFile('file-id')

      expect(mockDrive.files.delete).toHaveBeenCalledWith({
        fileId: 'file-id',
      })

      expect(result).toBe(true)
    })
  })

  describe('useGoogleDrive', () => {
    it('should create and return a service instance', async () => {
      // Mock app configuration
      const mockApp = {
        get: vi.fn().mockReturnValue({
          serviceAccount: JSON.stringify({
            client_email: 'test@example.com',
            private_key: 'mock-key',
          }),
          rootFolder: 'TestBookEdge',
          workspaceDomain: 'test.example.com',
        }),
      }

      const { getService } = useGoogleDrive(mockApp)

      // Mock the initialize method
      GoogleDriveService.prototype.initialize = vi
        .fn()
        .mockResolvedValue(undefined)

      const service = await getService()
      expect(service).toBeInstanceOf(GoogleDriveService)

      // Calling again should return the same instance
      const service2 = await getService()
      expect(service2).toBe(service)

      // Verify app.get was called with the right config key
      expect(mockApp.get).toHaveBeenCalledWith('googleDrive')
    })
  })
})
