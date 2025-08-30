import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('contributors', (table) => {
    table.unique(
      ['published_name', 'legal_name'],
      'contributors_published_legal_name_unique',
    )
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('contributors', (table) => {
    table.dropUnique(
      ['published_name', 'legal_name'],
      'contributors_published_legal_name_unique',
    )
  })
}
