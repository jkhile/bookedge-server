import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Add has_images boolean column
  await knex.schema.alterTable('books', (table) => {
    table.boolean('has_images').defaultTo(false)
  })

  // Initialize has_images based on image_count (true if image_count > 0, false otherwise)
  await knex.raw(`
    UPDATE books SET has_images = (image_count > 0)
  `)

  // Remove the image_count column
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('image_count')
  })
}

export async function down(knex: Knex): Promise<void> {
  // Re-add image_count column
  await knex.schema.alterTable('books', (table) => {
    table.integer('image_count').defaultTo(0)
  })

  // Convert has_images back to image_count (1 if true, 0 if false)
  await knex.raw(`
    UPDATE books SET image_count = CASE WHEN has_images THEN 1 ELSE 0 END
  `)

  // Remove has_images column
  await knex.schema.alterTable('books', (table) => {
    table.dropColumn('has_images')
  })
}
