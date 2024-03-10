import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('endorsements', (table) => {
    table
      .integer('fk_book')
      .references('id')
      .inTable('books')
      .onDelete('CASCADE')
    table.text('date').defaultTo('')
    table.text('by').defaultTo('')
    table.text('text').defaultTo('')
    table.text('notes').defaultTo('')
    table.text('created_at')
    table
      .integer('fk_created_by')
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('endorsements', (table) => {
    table.dropColumn('fk_book')
    table.dropColumn('date')
    table.dropColumn('by')
    table.dropColumn('created_at')
    table.dropColumn('fk_created_by')
  })
}
