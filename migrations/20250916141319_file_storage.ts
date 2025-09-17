import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Create file_storage table
  await knex.schema.createTable('file_storage', (table) => {
    table.increments('id').primary()

    // Foreign key to books table
    table.integer('book_id').unsigned().notNullable()
    table
      .foreign('book_id')
      .references('id')
      .inTable('books')
      .onDelete('CASCADE')

    // Google Drive specific fields
    table.string('drive_id', 255).notNullable().unique() // Google Drive file ID
    table.string('drive_folder_id', 255) // Parent folder ID in Google Drive

    // File information
    table.string('file_name', 500).notNullable()
    table.string('file_path', 1000).notNullable() // Full path in Google Drive
    table.string('original_name', 500).notNullable() // Original filename from upload
    table.bigInteger('file_size').notNullable() // Size in bytes
    table.string('file_type', 255).notNullable() // MIME type
    table.string('file_extension', 50) // File extension

    // File categorization
    table.string('purpose', 255) // Purpose of file (e.g., 'cover', 'interior', 'marketing', 'editorial')
    table.string('description', 1000) // Optional description

    // Status and metadata
    table.boolean('finalized').defaultTo(false).notNullable()
    table.jsonb('metadata').defaultTo('{}') // Additional metadata as JSON

    // Tracking fields
    table.integer('uploaded_by').unsigned().notNullable()
    table
      .foreign('uploaded_by')
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
    table
      .timestamp('uploaded_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now())

    table.integer('updated_by').unsigned()
    table
      .foreign('updated_by')
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
    table
      .timestamp('updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now())

    // Indexes for performance
    table.index(['book_id'], 'idx_file_storage_book_id')
    table.index(['drive_id'], 'idx_file_storage_drive_id')
    table.index(['purpose'], 'idx_file_storage_purpose')
    table.index(['uploaded_at'], 'idx_file_storage_uploaded_at')
    table.index(['finalized'], 'idx_file_storage_finalized')
  })

  // Create file_downloads table for tracking download history
  await knex.schema.createTable('file_downloads', (table) => {
    table.increments('id').primary()

    // Foreign key to file_storage
    table.integer('file_storage_id').unsigned().notNullable()
    table
      .foreign('file_storage_id')
      .references('id')
      .inTable('file_storage')
      .onDelete('CASCADE')

    // Who downloaded
    table.integer('downloaded_by').unsigned().notNullable()
    table
      .foreign('downloaded_by')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')

    // When downloaded
    table
      .timestamp('downloaded_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now())

    // Download metadata
    table.string('ip_address', 45) // Support IPv6
    table.string('user_agent', 500)
    table.integer('bytes_downloaded').unsigned() // For tracking partial downloads
    table.boolean('completed').defaultTo(true).notNullable()

    // Indexes for performance
    table.index(['file_storage_id'], 'idx_file_downloads_file_id')
    table.index(['downloaded_by'], 'idx_file_downloads_user_id')
    table.index(['downloaded_at'], 'idx_file_downloads_downloaded_at')
  })

  // Create file_access_logs table for detailed access tracking
  await knex.schema.createTable('file_access_logs', (table) => {
    table.increments('id').primary()

    // Foreign key to file_storage
    table.integer('file_storage_id').unsigned().notNullable()
    table
      .foreign('file_storage_id')
      .references('id')
      .inTable('file_storage')
      .onDelete('CASCADE')

    // Access type
    table
      .enum('action', [
        'view',
        'download',
        'upload',
        'update',
        'delete',
        'move',
        'rename',
        'share',
      ])
      .notNullable()

    // Who performed the action
    table.integer('user_id').unsigned().notNullable()
    table
      .foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')

    // When and additional info
    table
      .timestamp('performed_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now())
    table.jsonb('details').defaultTo('{}') // Additional details about the action

    // Indexes
    table.index(['file_storage_id'], 'idx_file_access_logs_file_id')
    table.index(['user_id'], 'idx_file_access_logs_user_id')
    table.index(['action'], 'idx_file_access_logs_action')
    table.index(['performed_at'], 'idx_file_access_logs_performed_at')
  })

  // Add file_storage_id to books table for quick reference to book's files
  await knex.schema.alterTable('books', (table) => {
    table.string('drive_folder_id', 255) // Google Drive folder ID for this book
    table.index(['drive_folder_id'], 'idx_books_drive_folder_id')
  })
}

export async function down(knex: Knex): Promise<void> {
  // Remove drive_folder_id from books table
  await knex.schema.alterTable('books', (table) => {
    table.dropIndex(['drive_folder_id'], 'idx_books_drive_folder_id')
    table.dropColumn('drive_folder_id')
  })

  // Drop tables in reverse order due to foreign key constraints
  await knex.schema.dropTableIfExists('file_access_logs')
  await knex.schema.dropTableIfExists('file_downloads')
  await knex.schema.dropTableIfExists('file_storage')
}
