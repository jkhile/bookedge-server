import type { HookContext } from '../declarations'

export function delayForTesting(msecs: number) {
  return async (context: HookContext) => {
    await new Promise((resolve) => setTimeout(resolve, msecs))
    return context
  }
}
