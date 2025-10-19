import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Create contributor_photos table for contributor photo gallery functionality
  await knex.schema.createTable('contributor_photos', (table) => {
    table.increments('id').primary()

    // Relationships
    table.integer('contributor_id').notNullable()
    table
      .foreign('contributor_id')
      .references('id')
      .inTable('contributors')
      .onDelete('CASCADE')

    // Google Drive file information
    table.string('drive_file_id', 255).notNullable()
    table.text('drive_url').notNullable()
    table.text('thumbnail_url') // For performance optimization
    table.text('thumbnail_data') // Base64 encoded thumbnail for immediate display
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
    table.unique(['contributor_id', 'drive_file_id'])
    table.index(['contributor_id'], 'idx_contributor_photos_contributor')
    table.index(
      ['contributor_id', 'display_order'],
      'idx_contributor_photos_display_order',
    )
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('contributor_photos')
}
