// Helper functions for working with Google Drive service
import { Application } from '../declarations'
import { getDriveService } from '../google-drive'
import { logger } from '../logger'

/**
 * Get the Google Drive service from the context or globally
 *
 * @param app The Feathers application (optional if using global)
 * @returns The Google Drive service instance
 */
export const getDrive = (app?: Application) => {
  if (app) {
    // Try to get from app first if provided
    const driveService = app.get('driveService')
    if (driveService) {
      return driveService
    }
  }

  // Fall back to global singleton
  return getDriveService()
}

/**
 * Helper function to upload a file for a specific book
 *
 * @param app The Feathers application
 * @param bookId The book ID
 * @param filePath Local path to the file
 * @param fileName Name to store the file as
 * @param description Optional description for the file
 * @returns The uploaded file metadata
 */
export const uploadBookFile = async (
  app: Application,
  bookId: number,
  filePath: string,
  fileName: string,
  description?: string,
) => {
  try {
    const driveService = getDrive(app)

    // Get or create the books folder
    const booksFolder = await driveService.createFolder(
      'Books',
      driveService.getRootFolderId(),
    )

    // Create a folder for this specific book
    const bookFolder = await driveService.createFolder(
      `Book_${bookId}`,
      booksFolder.id,
    )

    // Upload the file
    const file = await driveService.uploadFile(filePath, {
      folderId: bookFolder.id,
      name: fileName,
      description,
    })

    logger.info('Book file uploaded successfully', {
      bookId,
      fileName,
      fileId: file.id,
      webViewLink: file.webViewLink,
    })

    return file
  } catch (error) {
    logger.error('Failed to upload book file', {
      bookId,
      filePath,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

/**
 * Helper function to download a file
 *
 * @param app The Feathers application
 * @param fileId The Google Drive file ID
 * @param destinationPath Local path to save the file to
 * @returns Path to the downloaded file
 */
export const downloadFile = async (
  app: Application,
  fileId: string,
  destinationPath: string,
) => {
  try {
    const driveService = getDrive(app)
    return await driveService.downloadFile(fileId, destinationPath)
  } catch (error) {
    logger.error('Failed to download file', {
      fileId,
      destinationPath,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

/**
 * Helper function to get file content
 *
 * @param app The Feathers application
 * @param fileId The Google Drive file ID
 * @returns The file content as a string
 */
export const getFileContent = async (app: Application, fileId: string) => {
  try {
    const driveService = getDrive(app)
    return await driveService.getFileContent(fileId)
  } catch (error) {
    logger.error('Failed to get file content', {
      fileId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}
