import type { HookContext } from '../../declarations'
import { logger } from '../../logger'

/**
 * Emit progress events via WebSocket
 */
export const emitProgress = (eventName: string) => {
  return async (context: HookContext) => {
    const { app, result, params } = context

    // Only emit for socket connections
    if (params.provider === 'socketio' && params.connection) {
      const channel = app.channel(`user-${params.user?.id}`)

      if (channel) {
        channel.send({
          type: eventName,
          data: result,
        })
      }
    }

    return context
  }
}

/**
 * Validate file upload permissions
 */
export const validateUploadPermissions = async (context: HookContext) => {
  const { params, data } = context

  if (!params.user) {
    throw new Error('Authentication required')
  }

  // Get bookId from data (simplified structure uses bookId instead of book_id)
  const bookId = data?.bookId || data?.book_id

  if (!bookId) {
    throw new Error('Book ID is required for upload')
  }

  // Check if user has permission to upload to the specified book
  const hasPermission = await checkBookPermission(params.user.id, bookId)

  if (!hasPermission) {
    throw new Error('You do not have permission to upload files to this book')
  }

  return context
}

/**
 * Check if a user has permission for a book operation
 */
async function checkBookPermission(
  _userId: number,
  _bookId: number,
): Promise<boolean> {
  // For now, allow all authenticated users
  // TODO: Implement your permission logic here based on:
  // - userId: User making the request
  // - bookId: Book being accessed
  // - operation: Type of operation
  return true
}

/**
 * Log file operations for audit
 */
export const auditFileOperation = (operation: string) => {
  return async (context: HookContext) => {
    const { params, data, result } = context

    logger.info('File operation audit', {
      operation,
      userId: params.user?.id,
      userEmail: params.user?.email,
      fileId: result?.fileId || context.id,
      fileName: result?.fileName || data?.file?.name,
      bookId: result?.bookId || data?.bookId,
      purpose: result?.purpose || data?.purpose,
      timestamp: new Date().toISOString(),
    })

    return context
  }
}
