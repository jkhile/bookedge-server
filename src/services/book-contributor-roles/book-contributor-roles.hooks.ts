import type { HookContext } from '../../declarations'
import type { BookContributorRolesService } from './book-contributor-roles.class'
import type {
  BookContributorRoles,
  BookContributorRolesData,
  BookContributorRolesPatch,
} from './book-contributor-roles.schema'
import { Conflict, BadRequest } from '@feathersjs/errors'

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
    throw new BadRequest(
      'Multiple contributors cannot be added at once. Please add contributors one at a time.',
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

  // Get the fk_contributor and fk_book from data (for create) or from existing record (for update/patch)
  let fkContributor = recordData.fk_contributor
  let fkBook = recordData.fk_book

  // For update/patch operations, get missing values from existing record
  if ((method === 'patch' || method === 'update') && id) {
    const existingRecord = await app.service('book-contributor-roles').get(id)
    if (!fkContributor) {
      fkContributor = existingRecord.fk_contributor
    }
    if (!fkBook) {
      fkBook = existingRecord.fk_book
    }
  }

  // If we still don't have required IDs, we can't validate
  if (!fkContributor || !fkBook) {
    return context
  }

  // First check: Direct duplicate (same book, contributor, and role)
  // This is what the database constraint checks
  const directDuplicateQuery: any = {
    fk_book: fkBook,
    fk_contributor: fkContributor,
    contributor_role: recordData.contributor_role,
  }

  // For update/patch, exclude the current record from the check
  if (id) {
    directDuplicateQuery.id = { $ne: id }
  }

  // Check for direct duplicate
  const directDuplicates = await app.service('book-contributor-roles').find({
    query: directDuplicateQuery,
    paginate: false,
  })

  const directDuplicatesArray =
    directDuplicates as unknown as BookContributorRoles[]

  if (directDuplicatesArray.length > 0) {
    // This is a direct duplicate that violates the database constraint
    const userMessage =
      `This contributor already has the ${recordData.contributor_role} role for this book. ` +
      `Each contributor can only have each role once per book.`

    const errorData = {
      code: 'DUPLICATE_BOOK_CONTRIBUTOR_ROLE',
      fk_book: fkBook,
      fk_contributor: fkContributor,
      role: recordData.contributor_role,
    }

    throw new Conflict(userMessage, errorData)
  }

  // Second check: Check for same person with different contributor record
  // Get the contributor details to check their names
  const contributor = await app.service('contributors').get(fkContributor)

  // Build query to find existing book-contributor-roles for the same book and role
  const samePersionQuery: any = {
    fk_book: fkBook,
    contributor_role: recordData.contributor_role,
  }

  // For update/patch, exclude the current record from the check
  if (id) {
    samePersionQuery.id = { $ne: id }
  }

  // Find all book-contributor-roles with the same role for this book
  const existingRoles = await app.service('book-contributor-roles').find({
    query: samePersionQuery,
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
      // Create detailed error message for logging
      const detailedMessage =
        `Duplicate contributor validation failed: ` +
        `published_name="${contributor.published_name}", ` +
        `legal_name="${contributor.legal_name}", ` +
        `contributor_role="${recordData.contributor_role}", ` +
        `existing_contributor_id=${existingContributor.id}`

      // Create user-friendly error message
      const userMessage =
        `This contributor is already assigned the ${recordData.contributor_role} role for this book. ` +
        `Please check if this is a duplicate entry or use a different contributor.`

      // Throw Conflict error with user-friendly message and detailed data for logging
      const errorData = {
        code: 'DUPLICATE_CONTRIBUTOR_ROLE',
        contributor: {
          published_name: contributor.published_name,
          legal_name: contributor.legal_name,
        },
        role: recordData.contributor_role,
        existing_contributor_id: existingContributor.id,
        detail: detailedMessage,
      }

      throw new Conflict(userMessage, errorData)
    }
  }

  return context
}
