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
    // Create unique constraint to prevent duplicate book-contributor-role combinations
    table.unique(['fk_book', 'fk_contributor', 'contributor_role'])

    // Create indexes for foreign keys
    table.index('fk_book')
    table.index('fk_contributor')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('book-contributor-roles')
}
