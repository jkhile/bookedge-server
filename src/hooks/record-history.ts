import { format } from 'date-fns'
import { diff, Operation } from 'just-diff'
import type { HookContext, NextFunction } from '../declarations'
// For more information about this file see https://dove.feathersjs.com/guides/cli/hook.html

// Define a type for service names to help with type checking
type HistoryServiceName = 'books-history' | string

// Define an interface for hook options
interface RecordHistoryOptions {
  fields: string[] // Fields to track changes for
  entityType: string // Type of entity (e.g., 'book', 'contributor')
  historyService?: HistoryServiceName // Service name for history storage (default: 'books-history')
  defaultValues?: Record<string, any> // Default values for new entities
}

// Define the structure of a history record
interface HistoryRecord {
  entity_type: string
  entity_id: number
  fk_user: number
  user_email: string
  change_date: string
  op: Operation
  path: string
  value: any
  [key: string]: any // Allow for indexed access for backward compatibility
}

export function recordHistoryHook(
  options: RecordHistoryOptions,
): (context: HookContext, next: NextFunction) => Promise<void> {
  return async (context: HookContext, next: NextFunction) => {
    // Extract options with defaults
    const {
      fields,
      entityType,
      historyService = 'books-history', // Default to books-history for backwards compatibility
      defaultValues = {},
    } = options

    // before:
    // save existing record in context for diffing against later
    const { user } = context.params
    context.priorValue = context.id
      ? await context.service.get(context.id, { user })
      : defaultValues

    await next()

    // after:
    // diff existing record against new record
    const diffs = diff(context.priorValue, context.result)
    for (const diff of diffs) {
      const path = diff.path[0] as string
      if (fields.includes(path)) {
        const value = diff.op === 'remove' ? '' : diff.value

        // Create a history record with the new generic structure
        const historyRecord: HistoryRecord = {
          entity_type: entityType,
          entity_id: context.result.id as number,
          fk_user: user.id,
          user_email: user.email,
          change_date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          op: diff.op,
          path,
          value,
        }

        // For backward compatibility with books
        if (entityType === 'book') {
          historyRecord.fk_book = context.result.id as number
        }

        try {
          // Use any to bypass TypeScript's strict service name checking
          // This is safe because we're catching errors if the service doesn't exist
          const app = context.app as any
          await app.service(historyService).create(historyRecord)
        } catch (error: any) {
          console.error(`Error recording history for ${entityType}:`, error)
        }
      }
    }
  }
}
