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
  const { params } = context

  if (!params.user) {
    throw new Error('Authentication required')
  }

  // Check if user has permission to upload to the specified book
  // This is a placeholder - implement based on your permission model
  const hasPermission = await checkBookPermission()

  if (!hasPermission) {
    throw new Error('You do not have permission to upload files to this book')
  }

  return context
}

/**
 * Check if a user has permission for a book operation
 */
async function checkBookPermission(): Promise<boolean> {
  // For now, allow all authenticated users
  // Implement your permission logic here based on:
  // - app: Application instance
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
      fileId: result?.id || context.id,
      fileName: result?.file_name || data?.file?.originalname,
      bookId: result?.book_id || data?.book_id,
      timestamp: new Date().toISOString(),
    })

    return context
  }
}
