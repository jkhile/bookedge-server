import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.text('cover_file').defaultTo('')
    table.text('interior_file').defaultTo('')
    table.text('other_files').defaultTo('')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('cover_file')
    table.dropColumn('interior_file')
    table.dropColumn('other_files')
  })
}
