import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('signin-history', (table) => {
    table.dropColumn('text')
    table.text('op').defaultTo('')
    table.text('strategy').defaultTo('')
    table
      .integer('fk_user')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
    table.text('user_email').defaultTo('')
    table.text('user_name').defaultTo('')
    table.text('datetime').defaultTo('')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('signin-history', (table) => {
    table.dropColumn('op')
    table.dropColumn('strategy')
    table.dropColumn('fk_user')
    table.dropColumn('user_email')
    table.dropColumn('user_name')
    table.dropColumn('datetime')
    table.text('text').defaultTo('')
  })
}
