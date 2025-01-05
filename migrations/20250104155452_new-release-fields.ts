import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('releases', (table) => {
    table.float('base_print_cost').defaultTo(0)
    table.boolean('full_duplex_cover').defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('releases', (table) => {
    table.dropColumn('base_print_cost')
    table.dropColumn('full_duplex_cover')
  })
}
