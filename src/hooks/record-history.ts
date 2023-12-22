import { diff } from 'just-diff'
import { format } from 'date-fns'
import type { HookContext, NextFunction } from '../declarations'
// For more information about this file see https://dove.feathersjs.com/guides/cli/hook.html

export function recordHistoryHook(
  fields: string[],
): (context: HookContext, next: NextFunction) => Promise<void> {
  return async (context: HookContext, next: NextFunction) => {
    // before:
    // save existing record in context for diffing against later
    const { user } = context.params
    context.priorValue = await context.service.get(context.id, { user })

    await next()

    // after:
    // diff existing record against new record
    const diffs = diff(context.priorValue, context.result)
    for (const diff of diffs) {
      const path = diff.path[0] as string
      if (fields.includes(path)) {
        const value = diff.op === 'remove' ? '' : diff.value
        context.app
          .service('books-history')
          .create({
            fk_book: context.id as number,
            fk_user: user.id,
            user_email: user.email,
            change_date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            op: diff.op,
            path,
            value,
          })
          .catch((error) => {
            console.error(error)
          })
      }
    }
  }
}
