import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('mentions', (table) => {
    table.dropColumn('text')
    table
      .integer('fk_book')
      .references('id')
      .inTable('books')
      .onDelete('CASCADE')
    table.text('url').defaultTo('')
    table.text('source').defaultTo('')
    table.text('headline').defaultTo('')
    table.text('date').defaultTo('')
    table.text('byline').defaultTo('')
    table.text('created_at')
    table
      .integer('fk_created_by')
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('mentions', (table) => {
    table.dropColumn('fk_book')
    table.dropColumn('url')
    table.dropColumn('source')
    table.dropColumn('headline')
    table.dropColumn('date')
    table.dropColumn('byline')
    table.dropColumn('created_at')
    table.dropColumn('fk_created_by')
    table.text('text').defaultTo('')
  })
}
