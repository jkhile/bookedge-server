import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('review-quotes', (table) => {
    table.dropColumn('text')
    table
      .integer('fk_book')
      .references('id')
      .inTable('books')
      .onDelete('CASCADE')
    table.text('quote_text').defaultTo('')
    table.text('reviewer').defaultTo('')
    table.text('created_at')
    table
      .integer('fk_created_by')
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('review-quotes', (table) => {
    table.dropColumn('fk_book')
    table.dropColumn('quote_text')
    table.dropColumn('reviewer')
    table.dropColumn('created_at')
    table.dropColumn('fk_created_by')
    table.text('text').defaultTo('')
  })
}
