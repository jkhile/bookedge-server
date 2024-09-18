import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.text('kdp_keywords').defaultTo('')
    table.boolean('kdp_keywords_finalized').defaultTo(false)
    table.float('fep_percentage_share').defaultTo(0)
    table.float('fep_fixed_share').defaultTo(0)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('kdp_keywords')
    table.dropColumn('kdp_keywords_finalized')
    table.dropColumn('fep_percentage_share')
    table.dropColumn('fep_fixed_share')
  })
}
