import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users-imprints', (table) => {
    table.dropColumn('text')
    table
      .integer('fk_user')
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
    table
      .integer('fk_imprint')
      .references('id')
      .inTable('imprints')
      .onDelete('RESTRICT')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users-imprints', (table) => {
    table.dropColumn('fk_user')
    table.dropColumn('fk_imprint')
  })
}
