import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Clean up published_name field by removing trailing commas and whitespace
  await knex.raw(`
    UPDATE contributors
    SET published_name = TRIM(REGEXP_REPLACE(published_name, '[,\\s]+$', '', 'g'))
    WHERE published_name ~ '[,\\s]+$'
  `)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function down(knex: Knex): Promise<void> {
  // This migration cannot be reversed as we don't store the original values
  // The cleanup is a data improvement and should not be rolled back
}
