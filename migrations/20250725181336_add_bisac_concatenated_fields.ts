import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Add the new bisac concatenated fields
  await knex.schema.alterTable('books', (table) => {
    table.text('bisac_1').defaultTo('')
    table.text('bisac_2').defaultTo('')
    table.text('bisac_3').defaultTo('')
  })

  // Populate the new fields by concatenating existing code and name fields
  await knex.raw(`
    UPDATE books SET 
      bisac_1 = TRIM(CONCAT(COALESCE(bisac_code_1, ''), ' ', COALESCE(bisac_name_1, ''))),
      bisac_2 = TRIM(CONCAT(COALESCE(bisac_code_2, ''), ' ', COALESCE(bisac_name_2, ''))),
      bisac_3 = TRIM(CONCAT(COALESCE(bisac_code_3, ''), ' ', COALESCE(bisac_name_3, '')))
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('bisac_1')
    table.dropColumn('bisac_2')
    table.dropColumn('bisac_3')
  })
}
