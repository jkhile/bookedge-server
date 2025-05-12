import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('refresh-token', (table) => {
    table.dropColumn('text')
    table.integer('userId').notNullable().references('id').inTable('users')
    table.string('token').notNullable()
    table.timestamp('expiresAt').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
    // Add indexes for better performance
    table.index('userId')
    table.index('token')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('refresh-token', (table) => {
    table.dropIndex('token')
    table.dropIndex('userId')
    table.dropColumn('createdAt')
    table.dropColumn('updatedAt')
    table.dropColumn('expiresAt')
    table.dropColumn('token')
    table.dropColumn('userId')
    table.string('text')
  })
}
