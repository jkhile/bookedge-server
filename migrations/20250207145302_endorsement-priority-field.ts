import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('endorsements', (table) => {
    table.integer('priority')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('endorsements', (table) => {
    table.dropColumn('priority')
  })
}
