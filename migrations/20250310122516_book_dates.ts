import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.text('proposed_presale_date').defaultTo('')
    table.text('proposed_on_sale_date').defaultTo('')
    table.text('cover_text_submitted_date').defaultTo('')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('proposed_presale_date')
    table.dropColumn('proposed_on_sale_date')
    table.dropColumn('cover_text_submitted_date')
  })
}
