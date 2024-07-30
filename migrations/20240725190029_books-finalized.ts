import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.boolean('title_finalized').defaultTo(false)
    table.boolean('subtitle_finalized').defaultTo(false)
    table.boolean('short_description_finalized').defaultTo(false)
    table.boolean('long_description_finalized').defaultTo(false)
    table.boolean('back_cover_text_finalized').defaultTo(false)
    table.boolean('jacket_front_text_finalized').defaultTo(false)
    table.boolean('jacket_back_text_finalized').defaultTo(false)
    table.boolean('keywords_finalized').defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('title_finalized')
    table.dropColumn('subtitle_finalized')
    table.dropColumn('short_description_finalized')
    table.dropColumn('long_description_finalized')
    table.dropColumn('back_cover_text_finalized')
    table.dropColumn('jacket_front_text_finalized')
    table.dropColumn('jacket_back_text_finalized')
    table.dropColumn('keywords_finalized')
  })
}
