import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Step 1: Create temporary table to store deduplicated contributors
  await knex.raw(`
    CREATE TEMPORARY TABLE temp_unique_contributors AS
    SELECT DISTINCT ON (published_name)
      id,
      published_name,
      legal_name,
      biography,
      biography_finalized,
      email,
      public_email,
      address,
      phone,
      wikipedia_page,
      amazon_author_page,
      author_website,
      twitter,
      threads,
      bluesky,
      instagram,
      facebook,
      linkedin,
      goodreads,
      tiktok,
      notes,
      fk_created_by,
      created_at,
      fk_updated_by,
      updated_at
    FROM contributors
    WHERE published_name IS NOT NULL AND published_name != ''
    ORDER BY published_name, updated_at DESC NULLS LAST, id DESC
  `)

  // Step 2: Create mapping table for old IDs to new IDs
  await knex.raw(`
    CREATE TEMPORARY TABLE contributor_id_mapping AS
    SELECT
      c.id as old_id,
      c.fk_book,
      c.contributor_role,
      tuc.id as new_id
    FROM contributors c
    JOIN temp_unique_contributors tuc ON c.published_name = tuc.published_name
  `)

  // Step 3: Insert into book_contributors join table
  // Use DISTINCT ON to handle cases where the same person has multiple records for the same book/role
  await knex.raw(`
    INSERT INTO book_contributors (fk_book, fk_contributor, contributor_role, fk_created_by, created_at, fk_updated_by, updated_at)
    SELECT DISTINCT ON (cim.fk_book, cim.new_id, cim.contributor_role)
      cim.fk_book,
      cim.new_id,
      cim.contributor_role,
      c.fk_created_by,
      CASE 
        WHEN c.created_at IS NULL OR c.created_at = '' THEN NULL
        ELSE c.created_at::timestamp with time zone
      END as created_at,
      c.fk_updated_by,
      c.updated_at
    FROM contributor_id_mapping cim
    JOIN contributors c ON c.id = cim.old_id
    WHERE cim.fk_book IS NOT NULL
    ORDER BY cim.fk_book, cim.new_id, cim.contributor_role, c.updated_at DESC NULLS LAST, c.id DESC
  `)

  // Step 4: Migrate biography history records from duplicate contributors
  // First, copy biography history from contributors that will be deleted
  await knex.raw(`
    INSERT INTO "books-history" (entity_type, entity_id, fk_book, fk_user, user_email, change_date, op, path, value)
    SELECT
      'contributor' as entity_type,
      cim.new_id as entity_id,
      NULL as fk_book,
      bh.fk_user,
      bh.user_email,
      bh.change_date,
      bh.op,
      bh.path,
      bh.value
    FROM "books-history" bh
    JOIN contributor_id_mapping cim ON bh.entity_id = cim.old_id
    WHERE bh.entity_type = 'contributor'
      AND bh.path = '/biography'
      AND cim.old_id != cim.new_id
  `)

  // Step 5: Delete duplicate contributors (keeping only the unique ones)
  await knex.raw(`
    DELETE FROM contributors
    WHERE id NOT IN (SELECT id FROM temp_unique_contributors)
  `)

  // Step 6: Remove fk_book column from contributors table
  await knex.schema.alterTable('contributors', (table) => {
    table.dropColumn('fk_book')
    table.dropColumn('contributor_role')
  })

  // Clean up temporary tables (happens automatically at end of session)
}

export async function down(knex: Knex): Promise<void> {
  // Step 1: Add back the columns to contributors table
  await knex.schema.alterTable('contributors', (table) => {
    table
      .integer('fk_book')
      .references('id')
      .inTable('books')
      .onDelete('CASCADE')
    table.text('contributor_role').defaultTo('')
  })

  // Step 2: Restore contributor records from book_contributors
  // This will create duplicate contributors if one person contributed to multiple books
  await knex.raw(`
    INSERT INTO contributors (
      fk_book,
      contributor_role,
      legal_name,
      published_name,
      biography,
      biography_finalized,
      email,
      public_email,
      address,
      phone,
      wikipedia_page,
      amazon_author_page,
      author_website,
      twitter,
      threads,
      bluesky,
      instagram,
      facebook,
      linkedin,
      goodreads,
      tiktok,
      notes,
      fk_created_by,
      created_at,
      fk_updated_by,
      updated_at
    )
    SELECT
      bc.fk_book,
      bc.contributor_role,
      c.legal_name,
      c.published_name,
      c.biography,
      c.biography_finalized,
      c.email,
      c.public_email,
      c.address,
      c.phone,
      c.wikipedia_page,
      c.amazon_author_page,
      c.author_website,
      c.twitter,
      c.threads,
      c.bluesky,
      c.instagram,
      c.facebook,
      c.linkedin,
      c.goodreads,
      c.tiktok,
      c.notes,
      bc.fk_created_by,
      bc.created_at,
      bc.fk_updated_by,
      bc.updated_at
    FROM book_contributors bc
    JOIN contributors c ON c.id = bc.fk_contributor
  `)

  // Step 3: Delete the deduplicated contributors
  await knex.raw(`
    DELETE FROM contributors
    WHERE fk_book IS NULL
  `)

  // Note: We cannot fully restore the original history records as some data may be lost
  // This is why it's important to backup before running migrations
}
