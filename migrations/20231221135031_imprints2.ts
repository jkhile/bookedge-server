import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('imprints', (table) => {
    table.dropColumn('text')
    table.text('imprint_name').defaultTo('')
    table.text('accounting_code').defaultTo('')
    table.text('imprint_status').defaultTo('active')
    table.text('contact_name').defaultTo('')
    table.text('address1').defaultTo('')
    table.text('address2').defaultTo('')
    table.text('city').defaultTo('')
    table.text('state').defaultTo('')
    table.text('postal_code').defaultTo('')
    table.text('country').defaultTo('')
    table.text('email').defaultTo('')
    table.text('phone').defaultTo('')
    table.text('notes').defaultTo('')
    table.text('created_at')
    table.integer('fk_created_by').unsigned().references('users.id')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('imprints', (table) => {
    table.dropColumn('imprint_name')
    table.dropColumn('accounting_code')
    table.dropColumn('imprint_status')
    table.dropColumn('contact_name')
    table.dropColumn('address1')
    table.dropColumn('address2')
    table.dropColumn('city')
    table.dropColumn('state')
    table.dropColumn('postal_code')
    table.dropColumn('country')
    table.dropColumn('email')
    table.dropColumn('phone')
    table.dropColumn('notes')
    table.dropColumn('created_at')
    table.dropColumn('fk_created_by')
  })
}
