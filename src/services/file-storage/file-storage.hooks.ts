import type { HookContext } from '../../declarations'
import { logger } from '../../logger'

/**
 * Hook to log file access in the file_access_logs table
 */
export const logAccessHook = (
  action:
    | 'view'
    | 'download'
    | 'upload'
    | 'update'
    | 'delete'
    | 'move'
    | 'rename'
    | 'share',
) => {
  return async (context: HookContext) => {
    try {
      const { app, result, params } = context

      // Don't log if there's no authenticated user
      if (!params.user) {
        return context
      }

      // Get the file storage ID from the result
      let fileStorageId: number | undefined

      if (action === 'upload' && result) {
        fileStorageId = result.id
      } else if (result?.id) {
        fileStorageId = result.id
      } else if (context.id) {
        fileStorageId = Number(context.id)
      }

      if (!fileStorageId) {
        return context
      }

      // Log the access asynchronously (don't wait for it)
      app
        .service('file-access-logs')
        .create(
          {
            file_storage_id: fileStorageId,
            action,
            user_id: params.user.id,
            details: {
              ip: params.ip,
              userAgent: params.headers?.['user-agent'],
              method: context.method,
              path: context.path,
            },
          },
          {}, // Empty params for internal call
        )
        .catch((error: any) => {
          // Log error but don't fail the main operation
          logger.error('Failed to log file access', {
            error: error.message || error,
            fileStorageId,
            action,
            userId: params.user.id,
          })
        })
    } catch (error) {
      // Log error but don't fail the main operation
      logger.error('Error in logAccessHook', error)
    }

    return context
  }
}

/**
 * Hook to ensure users can only access files for books they have permission to
 */
export const restrictToBookAccess = async (context: HookContext) => {
  const { params, service } = context

  // Skip for internal calls
  if (!params.provider) {
    return context
  }

  // Admin users can access all files
  if (params.user?.role === 'admin') {
    return context
  }

  // For find queries, add book_id filter based on user permissions
  // This is a simplified version - you'll need to implement based on your permission model
  if (context.method === 'find') {
    // Get books the user has access to
    // This is placeholder logic - implement based on your requirements
    const userBookIds = await getUserBookIds(context.app, params.user?.id)

    // Add book_id filter to query
    if (!context.params.query) {
      context.params.query = {}
    }

    context.params.query.book_id = {
      $in: userBookIds,
    }
  }

  // For get, patch, remove - verify the file belongs to an accessible book
  if (['get', 'patch', 'remove'].includes(context.method || '')) {
    const fileId = context.id

    if (fileId) {
      const file = await service.get(fileId, { ...params, provider: undefined })

      const userBookIds = await getUserBookIds(context.app, params.user?.id)

      if (!userBookIds.includes(file.book_id)) {
        throw new Error('You do not have permission to access this file')
      }
    }
  }

  return context
}

// Helper function to get books a user has access to
// This is a placeholder - implement based on your permission model
async function getUserBookIds(app: any, userId?: number): Promise<number[]> {
  if (!userId) return []

  // For now, return all books - implement proper permission logic
  try {
    const books = await app.service('books').find({
      query: {
        $select: ['id'],
        $limit: 1000,
      },
      paginate: false,
    })

    return books.map((book: any) => book.id)
  } catch (error) {
    logger.error('Failed to get user book IDs', { userId, error })
    return []
  }
}
