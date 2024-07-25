import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table
      .specificType('pinned_books', 'INT[]')
      .defaultTo(knex.raw('ARRAY[]::INT[]'))
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('pinned_books')
  })
}
