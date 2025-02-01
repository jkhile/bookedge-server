import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.text('project_priorities').defaultTo('')
    table.text('supplementary_notes').defaultTo('')
    table.text('marketing_notes').defaultTo('')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('project_priorities')
    table.dropColumn('supplementry_notes')
    table.dropColumn('marketing_notes')
  })
}
