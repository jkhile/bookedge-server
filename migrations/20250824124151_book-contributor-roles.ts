// For more information about this file see https://dove.feathersjs.com/guides/cli/knexfile.html
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('book-contributor-roles', (table) => {
    table.increments('id')

    table
      .integer('fk_book')
      .notNullable()
      .references('id')
      .inTable('books')
      .onDelete('CASCADE')
    table
      .integer('fk_contributor')
      .notNullable()
      .references('id')
      .inTable('contributors')
      .onDelete('CASCADE')
    table.text('contributor_role').notNullable().defaultTo('')
    table
      .integer('fk_created_by')
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
    table.text('created_at').defaultTo('')
    table
      .integer('fk_updated_by')
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
    table.text('updated_at').defaultTo('')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('book-contributor-roles')
}
