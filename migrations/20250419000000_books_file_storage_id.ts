import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.text('file_storage_id').defaultTo('')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('file_storage_id')
  })
}
