// src/hooks/restrict-user-fields.ts
import { Forbidden } from '@feathersjs/errors'
import { HookContext } from '../declarations'

/**
 * Hook to restrict which user fields can be modified by non-admin users
 * Non-admin users can only modify their own email, name, and password
 */
export const restrictUserFields = async (context: HookContext) => {
  // Skip this hook if it's not a patch or update operation
  if (!['patch', 'update'].includes(context.method)) {
    return context
  }

  const { user } = context.params
  const isAdmin = user?.roles?.includes('admin')

  // Admins can do anything
  if (isAdmin) {
    return context
  }

  // Skip restriction for internal calls (no user means it's called internally)
  // This allows internal services and hooks to update user fields
  if (!user) {
    return context
  }

  // Make sure users can only modify their own user records
  if (context.id !== user?.id) {
    throw new Forbidden('You can only modify your own user record')
  }

  // For non-admins, restrict fields that can be modified
  const allowedFields = ['email', 'name', 'password']
  const modifiedFields = Object.keys(context.data)

  // Check if any disallowed fields are being modified
  const disallowedFields = modifiedFields.filter(
    (field) => !allowedFields.includes(field),
  )

  if (disallowedFields.length > 0) {
    throw new Forbidden(
      `You don't have permission to modify the following fields: ${disallowedFields.join(', ')}`,
    )
  }

  return context
}
