import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Add filename columns for each file field in books table
  const columnsToAdd = [
    'interior_file_name',
    'media_kit_file_name',
    'discussion_guide_file_name',
    'book_trailer_file_name',
    'cover_reveal_file_name',
    'media_list_file_name',
  ]

  for (const columnName of columnsToAdd) {
    const exists = await knex.schema.hasColumn('books', columnName)
    if (!exists) {
      await knex.schema.alterTable('books', (table) => {
        table.string(columnName, 255).nullable()
      })
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  // Remove the filename columns
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('interior_file_name')
    table.dropColumn('media_kit_file_name')
    table.dropColumn('discussion_guide_file_name')
    table.dropColumn('book_trailer_file_name')
    table.dropColumn('cover_reveal_file_name')
    table.dropColumn('media_list_file_name')
  })
}
