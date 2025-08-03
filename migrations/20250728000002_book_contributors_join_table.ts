import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Create the join table for many-to-many relationship
  await knex.schema.createTable('book_contributors', (table) => {
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
    table.integer('display_order').defaultTo(0)
    table
      .integer('fk_created_by')
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table
      .integer('fk_updated_by')
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
    table.timestamp('updated_at').defaultTo(knex.fn.now())

    // Create unique constraint to prevent duplicate book-contributor-role combinations
    table.unique(['fk_book', 'fk_contributor', 'contributor_role'])

    // Create indexes for foreign keys
    table.index('fk_book')
    table.index('fk_contributor')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('book_contributors')
}
