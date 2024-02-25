import { format } from 'date-fns'
import { diff } from 'just-diff'
import type { HookContext, NextFunction } from '../declarations'
// For more information about this file see https://dove.feathersjs.com/guides/cli/hook.html

export function recordHistoryHook(
  fields: string[],
): (context: HookContext, next: NextFunction) => Promise<void> {
  return async (context: HookContext, next: NextFunction) => {
    // before:
    // save existing record in context for diffing against later
    const { user } = context.params
    context.priorValue = context.id
      ? await context.service.get(context.id, { user })
      : {
          title: '',
          subtitle: '',
          short_description: '',
          long_description: '',
          keywords: '',
          notes: '',
        }

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
            fk_book: context.result.id as number,
            fk_user: user.id,
            user_email: user.email,
            change_date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            op: diff.op,
            path,
            value,
          })
          .catch((error: any) => {
            console.error(error)
          })
      }
    }
  }
}
