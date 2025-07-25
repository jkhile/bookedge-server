import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.text('bisac_notes').defaultTo('')
    table.text('mentions_notes').defaultTo('')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('bisac_notes')
    table.dropColumn('mentions_notes')
  })
}
