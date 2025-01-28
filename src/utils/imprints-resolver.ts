// src/utils/imprints-resolver.ts
import type { HookContext } from '../declarations'

/**
 * Resolves imprint access based on user permissions.
 * Returns either:
 * - The original value for internal calls or admin users
 * - A filtered set of allowed imprints for other authenticated users
 */
export const imprintsResolver = async (
  value: any,
  query: any,
  context: HookContext,
): Promise<any> => {
  // If no user in params, assume it's an internal call and return original value
  if (!context.params?.user) {
    return value
  }

  const user = context.params.user

  // Ensure user has roles defined
  if (!Array.isArray(user.roles)) {
    throw new Error('User roles not properly defined')
  }

  // Check if user is admin
  const isAdmin = user.roles.includes('admin')
  if (isAdmin) {
    return value
  }

  // Ensure allowed_imprints exists and is an array
  if (!Array.isArray(user.allowed_imprints)) {
    throw new Error('User allowed_imprints not properly defined')
  }

  // For empty allowed_imprints, return an impossible condition
  if (user.allowed_imprints.length === 0) {
    return { $in: [-1] } // No imprint will ever match this ID
  }

  // Ensure all imprint IDs are valid numbers
  const validImprints = user.allowed_imprints.filter(
    (id: unknown) => typeof id === 'number' && Number.isFinite(id) && id > 0,
  )

  return { $in: validImprints }
}
