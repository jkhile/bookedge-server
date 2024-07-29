import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('contributors', (table) => {
    table.boolean('biography_finalized').defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('contributors', (table) => {
    table.dropColumn('biography_finalized')
  })
}
