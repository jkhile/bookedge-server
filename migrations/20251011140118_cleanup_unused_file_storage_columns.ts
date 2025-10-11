import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Remove unused file_storage_id columns from books and users tables
  // These were added by earlier migrations but are no longer needed
  // since we're not using the file-storage service approach

  // Remove file_storage_id from books table if it exists
  const booksHasColumn = await knex.schema.hasColumn('books', 'file_storage_id')
  if (booksHasColumn) {
    await knex.schema.alterTable('books', (table) => {
      table.dropColumn('file_storage_id')
    })
  }

  // Remove file_storage_id from users table if it exists
  const usersHasColumn = await knex.schema.hasColumn('users', 'file_storage_id')
  if (usersHasColumn) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('file_storage_id')
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  // Re-add the columns if we need to rollback
  // Note: We won't restore any data that was in these columns

  const booksHasColumn = await knex.schema.hasColumn('books', 'file_storage_id')
  if (!booksHasColumn) {
    await knex.schema.alterTable('books', (table) => {
      table.text('file_storage_id').defaultTo('')
    })
  }

  const usersHasColumn = await knex.schema.hasColumn('users', 'file_storage_id')
  if (!usersHasColumn) {
    await knex.schema.alterTable('users', (table) => {
      table.text('file_storage_id').defaultTo('')
    })
  }
}
