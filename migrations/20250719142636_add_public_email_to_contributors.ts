import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('contributors', (table) => {
    table.text('public_email').defaultTo('')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('contributors', (table) => {
    table.dropColumn('public_email')
  })
}