import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Check if drive_folder_id column already exists (in case dev database has it)
  const hasColumn = await knex.schema.hasColumn('books', 'drive_folder_id')

  if (!hasColumn) {
    await knex.schema.alterTable('books', (table) => {
      table.string('drive_folder_id', 255) // Google Drive folder ID for this book
      table.index(['drive_folder_id'], 'idx_books_drive_folder_id')
    })
  }

  // Check for missing file link columns and add them if needed
  // These should already exist from earlier migrations, but let's be safe
  const columnsToCheck = [
    { name: 'media_kit_link', type: 'text', defaultValue: '' },
    { name: 'discussion_guide_link', type: 'text', defaultValue: '' },
    { name: 'book_trailer_link', type: 'text', defaultValue: '' },
    { name: 'cover_reveal_link', type: 'text', defaultValue: '' },
  ]

  for (const col of columnsToCheck) {
    const exists = await knex.schema.hasColumn('books', col.name)
    if (!exists) {
      await knex.schema.alterTable('books', (table) => {
        table.text(col.name).defaultTo(col.defaultValue)
      })
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  // Only drop the drive_folder_id column and index
  // Leave the file link columns as they may have been added by earlier migrations
  await knex.schema.alterTable('books', (table) => {
    table.dropIndex(['drive_folder_id'], 'idx_books_drive_folder_id')
    table.dropColumn('drive_folder_id')
  })
}
