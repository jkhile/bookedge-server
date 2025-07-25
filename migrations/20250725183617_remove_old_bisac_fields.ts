import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('bisac_code_1')
    table.dropColumn('bisac_name_1')
    table.dropColumn('bisac_code_2')
    table.dropColumn('bisac_name_2')
    table.dropColumn('bisac_code_3')
    table.dropColumn('bisac_name_3')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.text('bisac_code_1').defaultTo('')
    table.text('bisac_name_1').defaultTo('')
    table.text('bisac_code_2').defaultTo('')
    table.text('bisac_name_2').defaultTo('')
    table.text('bisac_code_3').defaultTo('')
    table.text('bisac_name_3').defaultTo('')
  })
}
