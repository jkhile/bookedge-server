// src/utils/imprints-resolver.ts
import type { HookContext } from '../declarations'

// utility function that can be called from service query resolvers
// to filter results based on the current user's allowed imprints
export const imprintsResolver = async (
  value: any,
  query: any,
  context: HookContext,
): Promise<any> => {
  // admins can see all imprints
  if (context.params.user.roles.includes('admin')) {
    return value
  }
  // for non-admins, user.allowed_imprints is an array of ids of
  // the imprints they are allowed to see
  const allowedImprints = context.params.user.allowed_imprints
  // return the value for the caller's fk_imprint query field
  return { $in: allowedImprints }
}
