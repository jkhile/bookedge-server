import { Hook, HookContext } from '@feathersjs/feathers'

/**
 * Set the current timestamp on a field
 */
export const setNow = (fieldName: string): Hook => {
  return async (context: HookContext) => {
    if (context.type === 'before') {
      if (context.method === 'create' || context.method === 'update') {
        context.data = {
          ...context.data,
          [fieldName]: new Date().toISOString(),
        }
      } else if (context.method === 'patch') {
        context.data = {
          ...context.data,
          [fieldName]: new Date().toISOString(),
        }
      }
    }
    return context
  }
}

/**
 * Set the current user ID on a field
 */
export const setUserId = (fieldName: string): Hook => {
  return async (context: HookContext) => {
    if (context.type === 'before' && context.params.user) {
      if (context.method === 'create' || context.method === 'update') {
        context.data = {
          ...context.data,
          [fieldName]: context.params.user.id,
        }
      } else if (context.method === 'patch' && context.id === null) {
        // Multi-patch
        context.data = {
          ...context.data,
          [fieldName]: context.params.user.id,
        }
      }
    }
    return context
  }
}
