import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('releases', (table) => {
    table.text('audio_book_sales_page').defaultTo('')
    table.text('audio_book_narrator').defaultTo('')
    table.integer('audio_book_run_time').defaultTo(0)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('releases', (table) => {
    table.dropColumn('audio_book_sales_page')
    table.dropColumn('audio_book_narrator')
    table.dropColumn('audio_book_run_time')
  })
}
