import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('contributors', (table) => {
    table.text('threads').defaultTo('')
    table.text('bluesky').defaultTo('')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('contributors', (table) => {
    table.dropColumn('threads')
    table.dropColumn('bluesky')
  })
}
