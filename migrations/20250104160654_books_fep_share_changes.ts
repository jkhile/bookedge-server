import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.renameColumn('fep_fixed_share', 'fep_fixed_share_pb')
    table.renameColumn('fep_percentage_share', 'fep_percentage_share_pb')
    table.float('fep_fixed_share_hc').defaultTo(0)
    table.float('fep_percentage_share_hc').defaultTo(0)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.renameColumn('fep_fixed_share_pb', 'fep_fixed_share')
    table.renameColumn('fep_percentage_share_pb', 'fep_percentage_share')
    table.dropColumn('fep_fixed_share_hc')
    table.dropColumn('fep_percentage_share_hc')
  })
}
