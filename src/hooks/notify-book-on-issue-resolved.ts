// In your issues.hooks.ts file
import type { HookContext } from '@feathersjs/feathers'

export const notifyBookOnIssueResolved = async (context: HookContext) => {
  // Only run on patch/update operations
  if (!['patch', 'update'].includes(context.method)) return context

  // Check if the resolved status is being changed
  const resolvedChanged = 'resolved' in context.data
  if (!resolvedChanged) return context

  // Get the associated book ID
  const issue = await context.service.get(context.id)
  const bookId = issue.fk_book

  if (bookId) {
    // Get the books service
    const booksService = context.app.service('books')

    // Trigger a patch on the book to force virtual fields to recalculate
    // We don't need to change any data, just trigger the patch
    const book = await booksService.get(bookId)
    await booksService.patch(bookId, {
      notes: book.notes, // Update notes with its current value
    })
  }

  return context
}
