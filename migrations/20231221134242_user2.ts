import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.text('name').defaultTo('')
    table.text('access_token').defaultTo('')
    table.text('access_token_expires').defaultTo('')
    table.text('refresh_token').defaultTo('')
    table.text('status').defaultTo('active')
    table
      .specificType('roles', 'text ARRAY')
      .defaultTo(knex.raw('ARRAY[]::text[]'))
    table
      .specificType('allowed_imprints', 'INT[]')
      .defaultTo(knex.raw('ARRAY[]::INT[]'))
    table
      .specificType('allowed_books', 'INT[]')
      .defaultTo(knex.raw('ARRAY[]::INT[]'))
    table.text('created_at')
    table.integer('fk_created_by').unsigned().references('users.id')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('name')
    table.dropColumn('access_token')
    table.dropColumn('access_token_expires')
    table.dropColumn('refresh_token')
    table.dropColumn('status')
    table.dropColumn('roles')
    table.dropColumn('allowed_imprints')
    table.dropColumn('created_at')
    table.dropColumn('fk_created_by')
  })
}
