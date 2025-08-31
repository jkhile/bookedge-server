import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Check if we've already run this migration
  const hasBookColumn = await knex.raw(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'contributors'
    AND column_name = 'fk_book'
  `)

  if (hasBookColumn.rows.length === 0) {
    console.log(
      'Migration appears to have already been run (fk_book column not found). Skipping...',
    )
    return
  }

  console.log('Starting contributor many-to-many migration...')

  // Step 1: Create the simple deduplication - just use DISTINCT ON with published_name
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
      substack,
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
    ORDER BY published_name, id DESC
  `)

  // Step 2: Create mapping table
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

  // Step 3: Insert into book-contributor-roles
  await knex.raw(`
    INSERT INTO "book-contributor-roles" (fk_book, fk_contributor, contributor_role, fk_created_by, created_at, fk_updated_by, updated_at)
    SELECT DISTINCT ON (cim.fk_book, cim.new_id, cim.contributor_role)
      cim.fk_book,
      cim.new_id,
      cim.contributor_role,
      c.fk_created_by,
      c.created_at,
      c.fk_updated_by,
      c.updated_at
    FROM contributor_id_mapping cim
    JOIN contributors c ON c.id = cim.old_id
    WHERE cim.fk_book IS NOT NULL
    ORDER BY cim.fk_book, cim.new_id, cim.contributor_role, c.id DESC
  `)

  // Step 4: Migrate history
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
    ON CONFLICT DO NOTHING
  `)

  // Step 5: Delete duplicate contributors
  await knex.raw(`
    DELETE FROM contributors
    WHERE id NOT IN (SELECT id FROM temp_unique_contributors)
  `)

  // Step 6: Remove columns
  await knex.schema.alterTable('contributors', (table) => {
    table.dropColumn('fk_book')
    table.dropColumn('contributor_role')
  })

  console.log('✅ Contributor migration complete!')
}

export async function down(knex: Knex): Promise<void> {
  // Add back the columns
  await knex.schema.alterTable('contributors', (table) => {
    table
      .integer('fk_book')
      .references('id')
      .inTable('books')
      .onDelete('CASCADE')
    table.text('contributor_role').defaultTo('')
  })

  // Restore from book-contributor-roles
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
      substack,
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
      c.substack,
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
    FROM "book-contributor-roles" bc
    JOIN contributors c ON c.id = bc.fk_contributor
  `)

  // Delete the deduplicated contributors
  await knex.raw(`
    DELETE FROM contributors
    WHERE fk_book IS NULL
  `)
}
