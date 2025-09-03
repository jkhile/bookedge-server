import { HookContext } from '@feathersjs/feathers'
import { Conflict, BadRequest, GeneralError } from '@feathersjs/errors'

/**
 * Hook to transform database constraint violations into user-friendly error messages
 * Should be used in the error hooks section
 */
export async function handleDatabaseErrors(context: HookContext) {
  const { error } = context

  // Only handle database errors
  if (!error || !error.message) {
    return context
  }

  const errorMessage = error.message.toLowerCase()

  // PostgreSQL duplicate key constraint violation
  if (errorMessage.includes('duplicate key value violates unique constraint')) {
    // Extract constraint name if possible
    const constraintMatch = error.message.match(/"([^"]+)"/)
    const constraintName = constraintMatch ? constraintMatch[1] : ''

    // Handle specific constraints with user-friendly messages
    if (
      constraintName.includes(
        'book_contributor_roles_fk_book_fk_contributor_contributor_role',
      )
    ) {
      context.error = new Conflict(
        'This contributor already has this role for this book. Each contributor can only have each role once per book.',
        {
          code: 'DUPLICATE_BOOK_CONTRIBUTOR_ROLE',
          constraint: constraintName,
          originalError: error.message,
        },
      )
    } else if (
      constraintName.includes('contributors_published_legal_name_unique')
    ) {
      context.error = new Conflict(
        'A contributor with this name already exists. Please check if this is a duplicate entry or use a different name.',
        {
          code: 'DUPLICATE_CONTRIBUTOR_NAME',
          constraint: constraintName,
          originalError: error.message,
        },
      )
    } else if (constraintName.includes('books_isbn13_unique')) {
      context.error = new Conflict(
        'A book with this ISBN already exists. Please check if this is a duplicate entry or verify the ISBN.',
        {
          code: 'DUPLICATE_ISBN',
          constraint: constraintName,
          originalError: error.message,
        },
      )
    } else if (constraintName.includes('users_email_unique')) {
      context.error = new Conflict(
        'An account with this email address already exists. Please use a different email or sign in to your existing account.',
        {
          code: 'DUPLICATE_EMAIL',
          constraint: constraintName,
          originalError: error.message,
        },
      )
    } else if (
      constraintName.includes('imprints') &&
      constraintName.includes('name')
    ) {
      context.error = new Conflict(
        'An imprint with this name already exists. Please use a different name.',
        {
          code: 'DUPLICATE_IMPRINT_NAME',
          constraint: constraintName,
          originalError: error.message,
        },
      )
    } else if (
      constraintName.includes('releases') &&
      constraintName.includes('unique')
    ) {
      context.error = new Conflict(
        'A release with these details already exists. Please check for duplicate information.',
        {
          code: 'DUPLICATE_RELEASE',
          constraint: constraintName,
          originalError: error.message,
        },
      )
    } else {
      // Generic duplicate key message
      context.error = new Conflict(
        'This record already exists. Please check for duplicate information.',
        {
          code: 'DUPLICATE_RECORD',
          constraint: constraintName,
          originalError: error.message,
        },
      )
    }
  }
  // Foreign key constraint violation
  else if (errorMessage.includes('violates foreign key constraint')) {
    context.error = new BadRequest(
      'The referenced record does not exist. Please check that all selected items are valid.',
      {
        code: 'INVALID_REFERENCE',
        originalError: error.message,
      },
    )
  }
  // Not null constraint violation
  else if (errorMessage.includes('violates not-null constraint')) {
    const columnMatch = error.message.match(/column "([^"]+)"/)
    const columnName = columnMatch ? columnMatch[1] : 'field'

    context.error = new BadRequest(
      `The ${columnName.replace(/_/g, ' ')} is required. Please provide a value.`,
      {
        code: 'REQUIRED_FIELD',
        field: columnName,
        originalError: error.message,
      },
    )
  }
  // Check constraint violation
  else if (errorMessage.includes('violates check constraint')) {
    context.error = new BadRequest(
      'The provided value does not meet the requirements. Please check your input and try again.',
      {
        code: 'INVALID_VALUE',
        originalError: error.message,
      },
    )
  }
  // Generic database error - don't expose internal details
  else if (
    errorMessage.includes('syntax error') ||
    errorMessage.includes('sql')
  ) {
    context.error = new GeneralError(
      'An error occurred while processing your request. Please try again.',
      {
        code: 'DATABASE_ERROR',
        // Log the original error for debugging but don't send to client
        originalError: error.message,
      },
    )
  }

  return context
}
