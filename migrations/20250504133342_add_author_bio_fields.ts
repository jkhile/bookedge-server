import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.text('short_author_bio').defaultTo('')
    table.boolean('short_author_bio_finalized').defaultTo(false)
    table.text('amazon_author_bio').defaultTo('')
    table.boolean('amazon_author_bio_finalized').defaultTo(false)
    table.text('one_line_author_bio').defaultTo('')
    table.boolean('one_line_author_bio_finalized').defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('one_line_author_bio_finalized')
    table.dropColumn('one_line_author_bio')
    table.dropColumn('amazon_author_bio_finalized')
    table.dropColumn('amazon_author_bio')
    table.dropColumn('short_author_bio_finalized')
    table.dropColumn('short_author_bio')
  })
}
