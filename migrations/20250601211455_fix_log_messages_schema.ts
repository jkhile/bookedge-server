import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('log-messages', (table) => {
    // Remove the old text column
    table.dropColumn('text')

    // Add new columns that match the schema
    table.string('level').notNullable()
    table.text('message').notNullable()
    table.string('source').defaultTo('client') // 'client' or 'server'
    table.jsonb('metadata').nullable() // Additional context
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())

    // Add indexes for performance
    table.index(['level'])
    table.index(['source'])
    table.index(['created_at'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('log-messages', (table) => {
    // Remove new columns
    table.dropIndex(['level'])
    table.dropIndex(['source'])
    table.dropIndex(['created_at'])
    table.dropColumn('level')
    table.dropColumn('message')
    table.dropColumn('source')
    table.dropColumn('metadata')
    table.dropColumn('created_at')
    table.dropColumn('updated_at')

    // Restore old column
    table.string('text')
  })
}
