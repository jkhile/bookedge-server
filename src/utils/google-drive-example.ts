// This is an example file demonstrating how to use the Google Drive service
// It is not meant to be used in production - just a reference for developers.

import { Application } from '../declarations'
import { useGoogleDrive } from './google-drive-service'
import { logger } from '../logger'
import { join } from 'path'
import fs from 'fs/promises'

/**
 * Example function showing how to upload a book file to Google Drive
 */
export const uploadBookFile = async (
  app: Application,
  bookId: number,
  filePath: string,
  fileName: string,
  description?: string,
) => {
  try {
    // Get the Google Drive service
    const { getService } = useGoogleDrive(app)
    const driveService = await getService()

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
 * Example function showing how to download a book file from Google Drive
 */
export const downloadBookFile = async (
  app: Application,
  fileId: string,
  downloadPath: string,
) => {
  try {
    // Get the Google Drive service
    const { getService } = useGoogleDrive(app)
    const driveService = await getService()

    // Download the file
    await driveService.downloadFile(fileId, downloadPath)

    logger.info('Book file downloaded successfully', {
      fileId,
      downloadPath,
    })

    return downloadPath
  } catch (error) {
    logger.error('Failed to download book file', {
      fileId,
      downloadPath,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

/**
 * Example function showing how to organize book files by imprint
 */
export const organizeBooksByImprint = async (
  app: Application,
  imprintId: number,
  imprintName: string,
  bookIds: number[],
) => {
  try {
    // Get the Google Drive service
    const { getService } = useGoogleDrive(app)
    const driveService = await getService()

    // Get or create the imprints folder
    const imprintsFolder = await driveService.createFolder(
      'Imprints',
      driveService.getRootFolderId(),
    )

    // Create a folder for this specific imprint
    const imprintFolder = await driveService.createFolder(
      `Imprint_${imprintId}_${imprintName}`,
      imprintsFolder.id,
    )

    // For each book, find its folder and move/copy it to the imprint folder
    for (const bookId of bookIds) {
      // Find the book folder
      const bookFolders = await driveService.findFiles({
        q: `mimeType='application/vnd.google-apps.folder' and name='Book_${bookId}' and trashed=false`,
      })

      if (bookFolders.length > 0) {
        const bookFolder = bookFolders[0]

        // Create a reference to the book in the imprint folder
        // (doesn't move the original folder, creates a reference/shortcut)
        await driveService.moveFile(bookFolder.id, imprintFolder.id, false)

        logger.info('Added book to imprint folder', {
          bookId,
          imprintId,
          bookFolderId: bookFolder.id,
          imprintFolderId: imprintFolder.id,
        })
      }
    }

    return imprintFolder
  } catch (error) {
    logger.error('Failed to organize books by imprint', {
      imprintId,
      bookIds,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

/**
 * Example function showing how to generate and upload a book report
 */
export const generateAndUploadBookReport = async (
  app: Application,
  bookId: number,
  bookTitle: string,
  reportContent: string,
) => {
  try {
    // Get the Google Drive service
    const { getService } = useGoogleDrive(app)
    const driveService = await getService()

    // Get or create the reports folder
    const reportsFolder = await driveService.createFolder(
      'Reports',
      driveService.getRootFolderId(),
    )

    // Create a temp file for the report
    const tempDir = await fs.mkdtemp('bookedge-report-')
    const tempFilePath = join(tempDir, `Book_${bookId}_Report.txt`)

    // Write the report content
    await fs.writeFile(tempFilePath, reportContent, 'utf8')

    // Upload the report
    const file = await driveService.uploadFile(tempFilePath, {
      folderId: reportsFolder.id,
      name: `Book_${bookId}_${bookTitle}_Report.txt`,
      description: `Generated report for book: ${bookTitle} (ID: ${bookId})`,
    })

    // Clean up temp file
    await fs.unlink(tempFilePath)
    await fs.rmdir(tempDir)

    logger.info('Report generated and uploaded successfully', {
      bookId,
      bookTitle,
      reportId: file.id,
      webViewLink: file.webViewLink,
    })

    return file
  } catch (error) {
    logger.error('Failed to generate and upload report', {
      bookId,
      bookTitle,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

/**
 * Example showing how to use the service for batch operations
 */
export const batchUploadBookFiles = async (
  app: Application,
  bookId: number,
  files: Array<{ path: string; name: string; description?: string }>,
) => {
  try {
    // Get the Google Drive service
    const { getService } = useGoogleDrive(app)
    const driveService = await getService()

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

    // Upload all files in parallel using Promise.all
    const uploadPromises = files.map((file) =>
      driveService.uploadFile(file.path, {
        folderId: bookFolder.id,
        name: file.name,
        description: file.description,
      }),
    )

    const uploadedFiles = await Promise.all(uploadPromises)

    logger.info('Multiple book files uploaded successfully', {
      bookId,
      fileCount: uploadedFiles.length,
      fileIds: uploadedFiles.map((f) => f.id),
    })

    return uploadedFiles
  } catch (error) {
    logger.error('Failed to batch upload book files', {
      bookId,
      fileCount: files.length,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

/**
 * Example showing how to use the service with book services hooks
 */
export const bookServiceHookExample = async (context: any) => {
  // Only run on the server
  if (!context.app || !context.result) {
    return context
  }

  try {
    const { getService } = useGoogleDrive(context.app)
    const driveService = await getService()

    // Get or create the books folder
    const booksFolder = await driveService.createFolder(
      'Books',
      driveService.getRootFolderId(),
    )

    // Create a folder for this book if it doesn't exist
    const bookId = context.result.id
    const bookFolders = await driveService.findFiles({
      q: `mimeType='application/vnd.google-apps.folder' and name='Book_${bookId}' and trashed=false`,
    })

    let bookFolder
    if (bookFolders.length === 0) {
      bookFolder = await driveService.createFolder(
        `Book_${bookId}`,
        booksFolder.id,
      )

      // Store the folder ID on the book record
      await context.app.service('books').patch(
        bookId,
        {
          file_storage_id: bookFolder.id,
        },
        { internal: true },
      )

      logger.info('Created Google Drive folder for book', {
        bookId,
        folderId: bookFolder.id,
      })
    } else {
      bookFolder = bookFolders[0]

      // Ensure the book has the folder ID stored
      if (!context.result.file_storage_id) {
        await context.app.service('books').patch(
          bookId,
          {
            file_storage_id: bookFolder.id,
          },
          { internal: true },
        )
      }
    }

    // Continue with hook processing
    return context
  } catch (error) {
    logger.error('Error in book service Google Drive hook', {
      bookId: context.result?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    // Don't block the main operation if Drive integration fails
    return context
  }
}
