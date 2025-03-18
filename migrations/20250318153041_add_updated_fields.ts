import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Add updated_by and updated_at fields to all tables that have created_by fields

  // 1. Books table
  await knex.schema.alterTable('books', (table) => {
    table.integer('fk_updated_by').unsigned().nullable().references('users.id')
    table.timestamp('updated_at').nullable()
  })

  // 2. Issues table
  await knex.schema.alterTable('issues', (table) => {
    table.integer('fk_updated_by').unsigned().nullable().references('users.id')
    table.timestamp('updated_at').nullable()
  })

  // 3. Contributors table
  await knex.schema.alterTable('contributors', (table) => {
    table.integer('fk_updated_by').unsigned().nullable().references('users.id')
    table.timestamp('updated_at').nullable()
  })

  // 4. Imprints table
  await knex.schema.alterTable('imprints', (table) => {
    table.integer('fk_updated_by').unsigned().nullable().references('users.id')
    table.timestamp('updated_at').nullable()
  })

  // 5. Mentions table
  await knex.schema.alterTable('mentions', (table) => {
    table.integer('fk_updated_by').unsigned().nullable().references('users.id')
    table.timestamp('updated_at').nullable()
  })

  // 6. Endorsements table
  await knex.schema.alterTable('endorsements', (table) => {
    table.integer('fk_updated_by').unsigned().nullable().references('users.id')
    table.timestamp('updated_at').nullable()
  })

  // 7. Review quotes table
  await knex.schema.alterTable('review-quotes', (table) => {
    table.integer('fk_updated_by').unsigned().nullable().references('users.id')
    table.timestamp('updated_at').nullable()
  })

  // 8. Pricings table
  await knex.schema.alterTable('pricings', (table) => {
    table.integer('fk_updated_by').unsigned().nullable().references('users.id')
    table.timestamp('updated_at').nullable()
  })

  // 9. Releases table
  await knex.schema.alterTable('releases', (table) => {
    table.integer('fk_updated_by').unsigned().nullable().references('users.id')
    table.timestamp('updated_at').nullable()
  })

  // 10. Users table
  await knex.schema.alterTable('users', (table) => {
    table.integer('fk_updated_by').unsigned().nullable().references('users.id')
    table.timestamp('updated_at').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  // Remove updated_by and updated_at fields from all tables

  // 1. Books table
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('fk_updated_by')
    table.dropColumn('updated_at')
  })

  // 2. Issues table
  await knex.schema.alterTable('issues', (table) => {
    table.dropColumn('fk_updated_by')
    table.dropColumn('updated_at')
  })

  // 3. Contributors table
  await knex.schema.alterTable('contributors', (table) => {
    table.dropColumn('fk_updated_by')
    table.dropColumn('updated_at')
  })

  // 4. Imprints table
  await knex.schema.alterTable('imprints', (table) => {
    table.dropColumn('fk_updated_by')
    table.dropColumn('updated_at')
  })

  // 5. Mentions table
  await knex.schema.alterTable('mentions', (table) => {
    table.dropColumn('fk_updated_by')
    table.dropColumn('updated_at')
  })

  // 6. Endorsements table
  await knex.schema.alterTable('endorsements', (table) => {
    table.dropColumn('fk_updated_by')
    table.dropColumn('updated_at')
  })

  // 7. Review quotes table
  await knex.schema.alterTable('review-quotes', (table) => {
    table.dropColumn('fk_updated_by')
    table.dropColumn('updated_at')
  })

  // 8. Pricings table
  await knex.schema.alterTable('pricings', (table) => {
    table.dropColumn('fk_updated_by')
    table.dropColumn('updated_at')
  })

  // 9. Releases table
  await knex.schema.alterTable('releases', (table) => {
    table.dropColumn('fk_updated_by')
    table.dropColumn('updated_at')
  })

  // 10. Users table
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('fk_updated_by')
    table.dropColumn('updated_at')
  })
}
