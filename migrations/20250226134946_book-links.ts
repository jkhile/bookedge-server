import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('amazon_a_plus_link')
    table.text('media_kit_link').defaultTo('')
    table.text('discussion_guide_link').defaultTo('')
    table.text('book_trailer_link').defaultTo('')
    table.text('cover_reveal_link').defaultTo('')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('media_kit_link')
    table.dropColumn('discussion_guide_link')
    table.dropColumn('book_trailer_link')
    table.dropColumn('cover_reveal_link')
    table.text('amazon_a_plus_link').defaultTo('')
  })
}
