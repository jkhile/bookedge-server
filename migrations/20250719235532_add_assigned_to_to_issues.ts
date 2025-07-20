import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('issues', (table) => {
    table.text('assigned_to').defaultTo('')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('issues', (table) => {
    table.dropColumn('assigned_to')
  })
}