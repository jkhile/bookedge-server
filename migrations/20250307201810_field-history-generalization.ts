import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Add new columns to books-history table for generalizing the structure
  await knex.schema.alterTable('books-history', (table) => {
    // Add new columns for entity type and ID
    table
      .string('entity_type')
      .nullable()
      .comment('Type of entity (book, contributor, etc.)')
    table.integer('entity_id').nullable().comment('ID of the entity')

    // Create indexes for better performance
    table.index(['entity_type', 'entity_id'])
  })

  // Populate entity_type and entity_id for existing records
  await knex.raw(`
    UPDATE "books-history"
    SET entity_type = 'book', entity_id = fk_book
    WHERE fk_book IS NOT NULL
  `)
}

export async function down(knex: Knex): Promise<void> {
  // Remove added columns if needed to roll back
  await knex.schema.alterTable('books-history', (table) => {
    table.dropIndex(['entity_type', 'entity_id'])
    table.dropColumn('entity_type')
    table.dropColumn('entity_id')
  })
}
