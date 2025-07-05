// Example hook showing how to use the Google Drive service
import { HookContext } from '../declarations'
import { getDrive } from '../utils/drive-helper'
import { logger } from '../logger'

/**
 * Example hook that creates a folder for a new book and stores the folder ID
 * with the book record.
 */
export const createBookFolder = async (context: HookContext) => {
  // Only run after a book is created
  if (context.type !== 'after' || context.method !== 'create') {
    return context
  }

  try {
    // Get the drive service from the app
    const driveService = getDrive(context.app)

    // Get the book data - either a single item or the first item in an array
    const book = Array.isArray(context.result)
      ? context.result[0]
      : context.result

    if (!book || !book.id) {
      return context
    }

    // Get or create the Books folder
    const booksFolder = await driveService.createFolder(
      'Books',
      driveService.getRootFolderId(),
    )

    // Create a folder for this book
    const bookTitle = book.title || `Book_${book.id}`
    const sanitizedTitle = bookTitle.replace(/[^\w\s-]/g, '_').substring(0, 100)
    const bookFolder = await driveService.createFolder(
      `${book.id}_${sanitizedTitle}`,
      booksFolder.id,
    )

    // Store the folder ID with the book
    await context.app
      .service('books')
      .patch(book.id, { file_storage_id: bookFolder.id })

    return context
  } catch (error) {
    // Log the error but don't fail the request
    logger.error('Failed to create book folder in Google Drive', {
      bookId: context.result?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    // Continue even if Drive operations fail
    return context
  }
}

/**
 * Example hook for processing an uploaded file - could be attached to
 * a custom upload endpoint.
 */
export const handleFileUpload = async (context: HookContext) => {
  // This would be used with a custom file upload endpoint
  if (!context.data || !context.data.tempFilePath || !context.data.bookId) {
    return context
  }

  try {
    const { tempFilePath, bookId, fileName, description } = context.data

    // Get the drive service
    const driveService = getDrive(context.app)

    // Find the book's folder
    const book = await context.app.service('books').get(bookId)

    if (!book.file_storage_id) {
      // Create folder if it doesn't exist
      const booksFolder = await driveService.createFolder(
        'Books',
        driveService.getRootFolderId(),
      )
      const bookTitle = book.title || `Book_${book.id}`
      const sanitizedTitle = bookTitle
        .replace(/[^\w\s-]/g, '_')
        .substring(0, 100)
      const bookFolder = await driveService.createFolder(
        `${book.id}_${sanitizedTitle}`,
        booksFolder.id,
      )

      // Update the book with the folder ID
      await context.app
        .service('books')
        .patch(bookId, { file_storage_id: bookFolder.id })

      book.file_storage_id = bookFolder.id
    }

    // Upload the file
    const uploadedFile = await driveService.uploadFile(tempFilePath, {
      folderId: book.file_storage_id,
      name: fileName || `file_${Date.now()}`,
      description,
    })

    // Include the file information in the response
    context.result = {
      ...context.result,
      file: {
        id: uploadedFile.id,
        name: uploadedFile.name,
        webViewLink: uploadedFile.webViewLink,
        thumbnailLink: uploadedFile.thumbnailLink,
      },
    }

    return context
  } catch (error) {
    logger.error('Failed to upload file to Google Drive', {
      bookId: context.data?.bookId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    // Don't fail the request if Drive operations fail
    return context
  }
}
