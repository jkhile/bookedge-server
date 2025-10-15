import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('book_images', (table) => {
    // Add column for storing base64 thumbnail data
    table.text('thumbnail_data').nullable()
    // We'll keep thumbnail_url for backward compatibility but won't use it
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('book_images', (table) => {
    table.dropColumn('thumbnail_data')
  })
}
