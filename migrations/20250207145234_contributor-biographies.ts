import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('contributors', (table) => {
    table.text('short_biography').defaultTo('')
    table.boolean('short_biography_finalized').defaultTo(false)
    table.text('amazon_biography').defaultTo('')
    table.boolean('amazon_biography_finalized').defaultTo(false)
    table.text('one_line_biography').defaultTo('')
    table.boolean('one_line_biography_finalized').defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('contributors', (table) => {
    table.dropColumn('short_biography')
    table.dropColumn('short_biography_finalized')
    table.dropColumn('amazon_biography')
    table.dropColumn('amazon_biography_finalized')
    table.dropColumn('one_line_biography')
    table.dropColumn('one_line_biography_finalized')
  })
}
