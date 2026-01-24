// Migration: Add imprint string column to books table
// This replaces the fk_imprint foreign key with a simple string for marketing/display purposes
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Add imprint column to books
  await knex.schema.alterTable('books', (table) => {
    table.text('imprint').defaultTo('')
  })

  // Populate imprint from existing imprints.imprint_name via fk_imprint
  await knex.raw(`
    UPDATE books
    SET imprint = COALESCE(
      (SELECT imprint_name FROM imprints WHERE imprints.id = books.fk_imprint),
      ''
    )
    WHERE fk_imprint IS NOT NULL
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('imprint')
  })
}
