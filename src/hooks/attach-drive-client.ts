// For more information about this file see https://dove.feathersjs.com/guides/cli/hook.html
import type { HookContext } from '../declarations'

export const attachDriveClient = async (context: HookContext) => {
  console.info(
    `Running hook attachDriveClient on ${context.path}.${context.method}`,
  )
  return context
}
