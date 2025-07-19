import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('mentions', (table) => {
    table.text('byline_email').defaultTo('')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('mentions', (table) => {
    table.dropColumn('byline_email')
  })
}
