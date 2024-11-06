// migrations/20231018123456_add_partial_unique_constraint_to_accounting_code.ts

import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Create a partial unique index on accounting_code
  await knex.schema.raw(`
    CREATE UNIQUE INDEX imprints_accounting_code_unique
    ON imprints (accounting_code)
    WHERE accounting_code <> '' AND accounting_code <> 'n/a';
  `)
}

export async function down(knex: Knex): Promise<void> {
  // Drop the partial unique index
  await knex.schema.raw(`
    DROP INDEX IF EXISTS imprints_accounting_code_unique;
  `)
}
