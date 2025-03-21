import type { Knex } from 'knex'

/**
 * This migration drops the review-quotes table since all functionality
 * has been migrated to the books.amazon_review_quotes field.
 */
export async function up(knex: Knex): Promise<void> {
  // Drop the review-quotes table
  await knex.schema.dropTableIfExists('review-quotes')
}

export async function down(knex: Knex): Promise<void> {
  // Recreate the review-quotes table
  await knex.schema.createTable('review-quotes', (table) => {
    table.increments('id')
    table
      .integer('fk_book')
      .references('id')
      .inTable('books')
      .onDelete('CASCADE')
    table.text('quote_text').defaultTo('')
    table.text('reviewer').defaultTo('')
    table.text('created_at')
    table
      .integer('fk_created_by')
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
  })
}
