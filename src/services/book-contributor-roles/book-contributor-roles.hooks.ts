import type { HookContext } from '../../declarations'
import type { BookContributorRolesService } from './book-contributor-roles.class'
import type {
  BookContributorRoles,
  BookContributorRolesData,
  BookContributorRolesPatch,
} from './book-contributor-roles.schema'

/**
 * Hook to check uniqueness of contributor based on published_name, legal_name, and contributor_role
 * Prevents creating duplicate contributors with the same names and role
 */
export async function checkUniqueContributorRole(
  context: HookContext<BookContributorRolesService>,
) {
  const { data, app, method, id } = context

  // Skip validation if no data
  if (!data) {
    return context
  }

  // Handle array of data (bulk operations not supported for this validation)
  if (Array.isArray(data)) {
    throw new Error(
      'Bulk operations are not supported when checking unique contributor roles',
    )
  }

  // Type guard to ensure we have the right data type
  const recordData = data as
    | BookContributorRolesData
    | BookContributorRolesPatch

  // Skip validation if no contributor role
  if (!recordData.contributor_role) {
    return context
  }

  // Get the fk_contributor from data (for create) or from existing record (for update/patch)
  let fkContributor = recordData.fk_contributor

  // For update/patch operations, if fk_contributor is not being changed, get it from existing record
  if ((method === 'patch' || method === 'update') && !fkContributor && id) {
    const existingRecord = await app.service('book-contributor-roles').get(id)
    fkContributor = existingRecord.fk_contributor
  }

  // If we still don't have a contributor ID, we can't validate
  if (!fkContributor) {
    return context
  }

  // Get the contributor details to check their names
  const contributor = await app.service('contributors').get(fkContributor)

  // Build query to find existing book-contributor-roles with the same role
  const query: any = {
    contributor_role: recordData.contributor_role,
  }

  // For update/patch, exclude the current record from the check
  if (id) {
    query.id = { $ne: id }
  }

  // Find all book-contributor-roles with the same role
  const existingRoles = await app.service('book-contributor-roles').find({
    query,
    paginate: false,
  })

  // Type assertion - when paginate is false, we get an array via unknown
  const rolesArray = existingRoles as unknown as BookContributorRoles[]

  // Check each existing role to see if the contributor has the same names
  for (const role of rolesArray) {
    // Skip if it's the same contributor (they can have multiple books with same role)
    if (role.fk_contributor === fkContributor) {
      continue
    }

    // Get the existing contributor's details
    const existingContributor = await app
      .service('contributors')
      .get(role.fk_contributor)

    // Check if the names match (case-insensitive comparison)
    if (
      existingContributor.published_name.toLowerCase() ===
        contributor.published_name.toLowerCase() &&
      existingContributor.legal_name.toLowerCase() ===
        contributor.legal_name.toLowerCase()
    ) {
      throw new Error(
        `A contributor with the same published name "${contributor.published_name}", ` +
          `legal name "${contributor.legal_name}", and role "${recordData.contributor_role}" already exists. ` +
          `(Existing contributor ID: ${existingContributor.id})`,
      )
    }
  }

  return context
}
