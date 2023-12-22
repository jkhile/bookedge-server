// src/utils/imprints-resolver.ts
import type { HookContext } from '../declarations'

// utility function that can be called from service query resolvers
// to filter results based on the current user's allowed imprints
export const imprintsResolver = async (
  value: any,
  query: any,
  context: HookContext,
): Promise<any> => {
  if (context.params.user.roles.includes('admin')) {
    // admins can see all imprints
    return value
  }
  // for non-admins, the users-imprints service has a list of
  // allowed imprints for each user.
  const usersImprintsService = context.app.service('users-imprints')
  const found = await usersImprintsService.find({
    query: {
      fk_user: context.params.user.id,
      $select: ['fk_imprint'],
    },
  })
  const allowedImprints = found.data.map((item) => item.fk_imprint)
  // return the value for the caller's fk_imprint query field
  return { $in: allowedImprints }
}
