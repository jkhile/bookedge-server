import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // First add the column to the books table
  await knex.schema.alterTable('books', (table) => {
    table.text('amazon_review_quotes').defaultTo('')
  })

  // Next, populate the amazon_review_quotes field for existing books
  // Get all books with associated review quotes
  const booksWithReviews = await knex
    .select(
      'books.id',
      knex.raw("string_agg(rq.quote_text, '\n\n') as combined_quotes"),
    )
    .from('books')
    .leftJoin('review-quotes as rq', 'books.id', 'rq.fk_book')
    .groupBy('books.id')
    .whereNotNull('rq.quote_text')

  // Update each book with the concatenated review quotes
  for (const book of booksWithReviews) {
    if (book.combined_quotes) {
      await knex('books')
        .where('id', book.id)
        .update({ amazon_review_quotes: book.combined_quotes })
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('amazon_review_quotes')
  })
}
