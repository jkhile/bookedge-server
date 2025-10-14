import type { Id, Params } from '@feathersjs/feathers'
import { BadRequest, NotFound } from '@feathersjs/errors'
import type { Application } from '../../declarations'
import { GoogleDriveManager } from '../../utils/google-drive-manager'
import { logger } from '../../logger'

export interface ImageProxyResult {
  data: Buffer
  mimeType: string
  fileName: string
}

export class ImageProxyService {
  app: Application
  driveManager: GoogleDriveManager

  constructor(app: Application) {
    this.app = app
    this.driveManager = GoogleDriveManager.getInstance(app)
  }

  /**
   * Get an image by Google Drive file ID
   * Returns the image data as a buffer
   */
  async get(fileId: Id, _params: Params): Promise<ImageProxyResult> {
    try {
      if (!fileId || typeof fileId !== 'string') {
        throw new BadRequest('File ID is required')
      }

      logger.debug('Fetching image from Google Drive', { fileId })

      // Get the Drive client
      const driveClient = await this.driveManager.getServiceAccountClient()

      // Get file metadata first
      const fileMetadata = await driveClient.getFile(fileId)

      // Download the file
      const stream = await driveClient.downloadFile(fileId)

      // Convert stream to buffer
      const chunks: Buffer[] = []

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => chunks.push(chunk))
        stream.on('error', reject)
        stream.on('end', () => {
          const buffer = Buffer.concat(chunks)

          resolve({
            data: buffer,
            mimeType: fileMetadata.mimeType || 'image/jpeg',
            fileName: fileMetadata.name || 'image.jpg',
          })
        })
      })
    } catch (error) {
      logger.error('Failed to proxy image', { fileId, error })
      throw new NotFound(`Image not found: ${fileId}`)
    }
  }
}
