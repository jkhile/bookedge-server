import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('issues', (table) => {
    table.dropColumn('text')
    table
      .integer('fk_book')
      .references('id')
      .inTable('books')
      .onDelete('CASCADE')
    table.text('date').defaultTo('')
    table.text('issue').defaultTo('')
    table.boolean('resolved').defaultTo(false)
    table.text('created_at')
    table
      .integer('fk_created_by')
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('issues', (table) => {
    table.dropColumn('fk_book')
    table.dropColumn('date')
    table.dropColumn('issue')
    table.dropColumn('resolved')
    table.dropColumn('created_at')
    table.dropColumn('fk_created_by')
    table.text('text')
  })
}
