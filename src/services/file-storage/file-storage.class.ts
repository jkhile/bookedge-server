/* eslint-disable unicorn/explicit-length-check */
/* eslint-disable sonarjs/no-duplicate-string */
import type {
  Id,
  NullableId,
  Params,
  ServiceInterface,
} from '@feathersjs/feathers'
import { BadRequest, NotFound, GeneralError } from '@feathersjs/errors'
import { google } from 'googleapis'
import type { Application } from '../../declarations'
import type {
  FileStorage,
  FileStorageData,
  FileStoragePatch,
  FileStorageQuery,
} from './file-storage.schema'
import { formatISO } from 'date-fns'

export type { FileStorage, FileStorageData, FileStoragePatch, FileStorageQuery }

export interface FileStorageServiceOptions {
  app: Application
  chunkSize: number
  maxFileSize: number
  chunkThreshold: number
}

export interface FileStorageParams extends Params<FileStorageQuery> {
  // Additional parameters for chunk operations
  chunk?: {
    index: number
    data: Buffer
    isLast: boolean
  }
}

const CHUNK_FOLDER = 'chunks'

export class FileStorageService<
  ServiceParams extends FileStorageParams = FileStorageParams,
> implements
    ServiceInterface<
      FileStorage,
      FileStorageData,
      ServiceParams,
      FileStoragePatch
    >
{
  constructor(public options: FileStorageServiceOptions) {}

  private async getDriveClient(params: ServiceParams) {
    const user = params.user
    if (!user?.access_token || !user.file_storage_id) {
      throw new BadRequest('User not authorized for file storage')
    }

    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: user.access_token })
    return google.drive({ version: 'v3', auth })
  }

  private async getChunkFolder(drive: any, parentFolderId: string) {
    const response = await drive.files.list({
      q: `name='${CHUNK_FOLDER}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id)',
    })

    if (response.data.files?.length > 0) {
      return response.data.files[0].id
    }

    // Create chunks folder if it doesn't exist
    const folder = await drive.files.create({
      requestBody: {
        name: CHUNK_FOLDER,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
      fields: 'id',
    })
    return folder.data.id
  }

  async find(params?: ServiceParams): Promise<FileStorage[]> {
    if (!params?.user) throw new BadRequest('Authentication required')

    const drive = await this.getDriveClient(params)
    const response = await drive.files.list({
      q: `'${params.user.file_storage_id}' in parents and mimeType!='application/vnd.google-apps.folder'`,
      fields: 'files(id, name, mimeType, size, createdTime)',
    })

    if (!response.data.files) {
      throw new GeneralError('No files found in Google Drive response')
    }
    return response.data.files.map((file) => {
      if (!file.id || !file.name || !file.mimeType) {
        throw new GeneralError('Invalid file metadata from Google Drive')
      }

      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        // eslint-disable-next-line unicorn/explicit-length-check
        size: Number.parseInt(file.size || '0', 10),
        fkUploadedBy: params.user?.id as number,
        uploadedAt: file.createdTime || formatISO(new Date()),
        status: 'complete' as const,
      }
    })
  }

  async get(id: Id, params?: ServiceParams): Promise<FileStorage> {
    if (!params?.user) throw new BadRequest('Authentication required')

    const drive = await this.getDriveClient(params)

    try {
      const response = await drive.files.get({
        fileId: id as string,
        fields: 'id, name, mimeType, size, createdTime',
      })

      const { data } = response
      if (!data.id || !data.name || !data.mimeType) {
        throw new GeneralError('Invalid file metadata from Google Drive')
      }

      return {
        id: data.id,
        name: data.name,
        mimeType: data.mimeType,
        // eslint-disable-next-line unicorn/explicit-length-check
        size: Number.parseInt(data.size || '0', 10),
        fkUploadedBy: params.user?.id as number,
        uploadedAt: data.createdTime || formatISO(new Date()),
        status: 'complete' as const,
      }
    } catch {
      throw new NotFound(`File with ID ${id} not found`)
    }
  }

  async create(
    data: FileStorageData,
    params?: ServiceParams,
  ): Promise<FileStorage>
  async create(
    data: FileStorageData[],
    params?: ServiceParams,
  ): Promise<FileStorage[]>
  async create(
    data: FileStorageData | FileStorageData[],
    params?: ServiceParams,
  ): Promise<FileStorage | FileStorage[]> {
    if (Array.isArray(data)) {
      return Promise.all(data.map((current) => this.create(current, params)))
    }

    if (!params?.user) throw new BadRequest('Authentication required')
    const drive = await this.getDriveClient(params)

    // Handle direct upload for small files
    if (data.size <= this.options.chunkThreshold && params.chunk?.data) {
      const response = await drive.files.create({
        requestBody: {
          name: data.name,
          mimeType: data.mimeType,
          parents: [params.user.file_storage_id as string],
        },
        media: {
          mimeType: data.mimeType,
          body: params.chunk.data,
        },
        fields: 'id, name, mimeType, size, createdTime',
      })

      const { data: fileData } = response
      if (!fileData.id || !fileData.name || !fileData.mimeType) {
        throw new GeneralError('Invalid file metadata from Google Drive')
      }

      return {
        id: fileData.id,
        name: fileData.name,
        mimeType: fileData.mimeType,
        size: Number.parseInt(fileData.size || '0', 10),
        fkUploadedBy: params.user.id as number,
        uploadedAt: fileData.createdTime || formatISO(new Date()),
        status: 'complete' as const,
      }
    }

    // Initialize chunked upload
    const timestamp = formatISO(new Date())
    return {
      id: `temp_${timestamp}`, // Temporary ID for tracking
      name: data.name,
      mimeType: data.mimeType,
      size: data.size,
      fkUploadedBy: params.user.id as number,
      uploadedAt: timestamp,
      chunks: Math.ceil(data.size / this.options.chunkSize),
      status: 'uploading' as const,
    }
  }
  async remove(id: NullableId, params?: ServiceParams): Promise<FileStorage> {
    if (!params?.user) throw new BadRequest('Authentication required')

    const drive = await this.getDriveClient(params)
    const file = await this.get(id as string, params)

    try {
      await drive.files.delete({ fileId: id as string })
      return file
    } catch (error) {
      throw error instanceof Error
        ? new GeneralError(`Failed to delete file: ${error.message}`)
        : new GeneralError('Failed to delete file: Unknown error')
    }
  }

  // Custom methods for chunk handling
  async uploadChunk(
    fileId: string,
    params: ServiceParams,
  ): Promise<{
    uploaded: number
    total: number
    complete: boolean
  }> {
    if (!params?.chunk) throw new BadRequest('Chunk data required')

    const drive = await this.getDriveClient(params)
    const chunkFolder = await this.getChunkFolder(
      drive,
      params.user?.file_storage_id as string,
    )

    // Save chunk
    await drive.files.create({
      requestBody: {
        name: `${fileId}_${params.chunk.index}`,
        parents: [chunkFolder],
      },
      media: {
        body: params.chunk.data,
      },
    })

    // If this is the last chunk, assemble the file
    return params.chunk.isLast
      ? {
          uploaded: params.chunk.index + 1,
          total: params.chunk.index + 1,
          complete: true,
        }
      : {
          uploaded: params.chunk.index + 1,
          total: -1, // Total chunks unknown until last chunk
          complete: false,
        }
  }
}

export const getOptions = (app: Application): FileStorageServiceOptions => {
  return {
    app,
    chunkSize: 5 * 1024 * 1024, // 5MB
    maxFileSize: 100 * 1024 * 1024, // 100MB
    chunkThreshold: 5 * 1024 * 1024, // 5MB
  }
}
