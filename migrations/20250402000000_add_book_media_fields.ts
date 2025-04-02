import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.text('media_list').defaultTo('')
    table.text('interior_advanced_praise').defaultTo('')
    table.float('audio_book_percentage').defaultTo(0)
    table.float('ebook_percentage').defaultTo(0)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('media_list')
    table.dropColumn('interior_advanced_praise')
    table.dropColumn('audio_book_percentage')
    table.dropColumn('ebook_percentage')
  })
}
