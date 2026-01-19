// For more information about this file see https://dove.feathersjs.com/guides/cli/knexfile.html
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('revenue-split-overrides', (table) => {
    table.increments('id')

    table
      .integer('fk_book')
      .notNullable()
      .references('id')
      .inTable('books')
      .onDelete('CASCADE')
    table.text('platform').notNullable()
    table.decimal('fep_fixed_amount', 10, 4).nullable()
    table.decimal('fep_percentage', 10, 4).nullable()
    table.decimal('pub_fixed_amount', 10, 4).nullable()
    table.decimal('pub_percentage', 10, 4).nullable()
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

    // Create unique constraint to prevent duplicate book-platform combinations
    table.unique(['fk_book', 'platform'])

    // Create index for foreign key lookups
    table.index('fk_book')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('revenue-split-overrides')
}
