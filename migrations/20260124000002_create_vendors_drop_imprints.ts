// Migration: Create vendors table and drop imprints
// Vendors table will be populated via import script from vendors-meta.json5
// Contact details (email, address) come from QuickBooks, not stored here
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // 1. Create new vendors table
  await knex.schema.createTable('vendors', (table) => {
    table.increments('id')
    table.text('code_prefix').notNullable().unique() // e.g., "MUN"
    table.text('vendor_name').notNullable().defaultTo('') // QB vendor display name
    table.text('statement_name').defaultTo('') // Name on statements (defaults to vendor_name if empty)
    table.boolean('generate_individual_statements').defaultTo(false)
    table.text('status').defaultTo('active') // 'active' or 'archived'
    table.text('notes').defaultTo('')
    table
      .integer('fk_created_by')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table
      .integer('fk_updated_by')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
    table.timestamp('updated_at').defaultTo(knex.fn.now())

    // Index for status filtering
    table.index('status')
  })

  // 2. Drop FK constraint from books.fk_imprint
  await knex.schema.alterTable('books', (table) => {
    table.dropForeign('fk_imprint')
  })

  // 3. Drop fk_imprint column from books
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('fk_imprint')
  })

  // 4. Drop imprints table
  await knex.schema.dropTable('imprints')
}

export async function down(knex: Knex): Promise<void> {
  // Recreate imprints table (simplified - full restore would need all columns)
  await knex.schema.createTable('imprints', (table) => {
    table.increments('id')
    table.text('imprint_name').defaultTo('')
    table.text('accounting_code').defaultTo('')
    table.text('status').defaultTo('active')
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
    table.text('statement_name').defaultTo('')
    table.boolean('generate_individual_statements').defaultTo(false)
    table.integer('fk_created_by').references('id').inTable('users')
    table.timestamp('created_at')
    table.integer('fk_updated_by').references('id').inTable('users')
    table.timestamp('updated_at')
  })

  // Add fk_imprint back to books
  await knex.schema.alterTable('books', (table) => {
    table
      .integer('fk_imprint')
      .references('id')
      .inTable('imprints')
      .onDelete('RESTRICT')
  })

  // Drop vendors table
  await knex.schema.dropTable('vendors')
}
