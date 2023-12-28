import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books-history', (table) => {
    table.dropColumn('text')
    table
      .integer('fk_book')
      .references('id')
      .inTable('books')
      .onDelete('RESTRICT')
    table
      .integer('fk_user')
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
    table.text('user_email').defaultTo('')
    table.text('change_date').defaultTo('')
    table.text('op').defaultTo('')
    table.text('path').defaultTo('')
    table.text('value').defaultTo('')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books-history', (table) => {
    table.dropColumn('fk_book')
    table.dropColumn('fk_user')
    table.dropColumn('user_email')
    table.dropColumn('change_date')
    table.dropColumn('op')
    table.dropColumn('path')
    table.dropColumn('value')
  })
}
