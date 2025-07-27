import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.boolean('bisac_1_finalized').defaultTo(false)
    table.boolean('bisac_2_finalized').defaultTo(false)
    table.boolean('bisac_3_finalized').defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('bisac_1_finalized')
    table.dropColumn('bisac_2_finalized')
    table.dropColumn('bisac_3_finalized')
  })
}
