import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('releases', (table) => {
    table.text('kdp_royalty_type').defaultTo('70%')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('releases', (table) => {
    table.dropColumn('kdp_royalty_type')
  })
}
