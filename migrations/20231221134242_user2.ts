import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.string('access_token')
    table.string('access_token_expires')
    table.string('refresh_token')
    table.string('user_status').defaultTo('active')
    table
      .specificType('roles', 'text ARRAY')
      .defaultTo(knex.raw('ARRAY[]::text[]'))
    table.string('created_at')
    table.integer('fk_created_by').unsigned().references('users.id')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('access_token')
    table.dropColumn('access_token_expires')
    table.dropColumn('refresh_token')
    table.dropColumn('user_status')
    table.dropColumn('roles')
    table.dropColumn('created_at')
    table.dropColumn('fk_created_by')
  })
}
