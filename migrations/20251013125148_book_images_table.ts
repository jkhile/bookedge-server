import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Create book_images table for gallery functionality
  await knex.schema.createTable('book_images', (table) => {
    table.increments('id').primary()

    // Relationships
    table.integer('book_id').notNullable()
    table
      .foreign('book_id')
      .references('id')
      .inTable('books')
      .onDelete('CASCADE')

    // Purpose field to distinguish between cover images and contributor photos
    table.string('purpose', 50).notNullable() // 'cover' or 'contributor'

    // Google Drive file information
    table.string('drive_file_id', 255).notNullable()
    table.text('drive_url').notNullable()
    table.text('thumbnail_url') // For performance optimization
    table.string('original_filename', 255).notNullable()
    table.bigInteger('file_size_bytes')
    table.string('mime_type', 100)
    table.integer('width')
    table.integer('height')

    // Metadata
    table.integer('uploaded_by')
    table.foreign('uploaded_by').references('id').inTable('users')
    table.timestamp('uploaded_at').defaultTo(knex.fn.now())
    table.integer('display_order').defaultTo(0) // For manual ordering
    table.text('comments') // User comments/notes about the image

    // System fields
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())

    // Indexes for performance
    table.unique(['book_id', 'drive_file_id'])
    table.index(['book_id', 'purpose'], 'idx_book_images_book_purpose')
    table.index(
      ['book_id', 'purpose', 'display_order'],
      'idx_book_images_display_order',
    )
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('book_images')
}
