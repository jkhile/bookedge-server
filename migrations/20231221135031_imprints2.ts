import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('imprints', (table) => {
    table.dropColumn('text')
    table.string('imprint_name').defaultTo('')
    table.string('accounting_code').defaultTo('')
    table.string('imprint_status').defaultTo('active')
    table.string('contact_name').defaultTo('')
    table.string('address1').defaultTo('')
    table.string('address2').defaultTo('')
    table.string('city').defaultTo('')
    table.string('state').defaultTo('')
    table.string('postal_code').defaultTo('')
    table.string('country').defaultTo('')
    table.string('email').defaultTo('')
    table.string('phone').defaultTo('')
    table.string('notes').defaultTo('')
    table.string('created_at')
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
