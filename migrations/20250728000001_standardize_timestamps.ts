import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  console.log('Starting timestamp standardization migration...')

  // List of tables that have created_at and updated_at columns
  const tablesToUpdate = [
    'books',
    'contributors',
    'book_contributors',
    'imprints',
    'users',
    'releases',
    'pricings',
    'issues',
    'endorsements',
    'mentions',
    'refresh_token',
    'signin_history',
    'books-history',
  ]

  for (const table of tablesToUpdate) {
    console.log(`Processing table: ${table}`)

    // Check if table exists
    const tableExists = await knex.schema.hasTable(table)
    if (!tableExists) {
      console.log(`  Table ${table} does not exist, skipping...`)
      continue
    }

    // Get current column info
    const hasCreatedAt = await knex.schema.hasColumn(table, 'created_at')
    const hasUpdatedAt = await knex.schema.hasColumn(table, 'updated_at')

    // For each timestamp column, check its current type and convert if needed
    if (hasCreatedAt) {
      const columnInfo = await knex.raw(
        `
        SELECT data_type, column_default
        FROM information_schema.columns
        WHERE table_name = ? AND column_name = 'created_at'
      `,
        [table],
      )

      const currentType = columnInfo.rows[0]?.data_type
      console.log(`  created_at current type: ${currentType}`)

      if (currentType !== 'timestamp with time zone') {
        // First, add a temporary column with the correct type
        await knex.schema.alterTable(table, (t) => {
          t.timestamp('created_at_new', { useTz: true })
        })

        // Convert and copy data, handling various formats and malformed timezones
        await knex.raw(`
          UPDATE "${table}" 
          SET created_at_new = 
            CASE 
              WHEN created_at IS NULL OR created_at = '' THEN NULL
              WHEN created_at = '1970-01-01T00:00:00.000Z' THEN NULL
              ELSE
                CASE
                  WHEN created_at::text ~ '^\\d{4}-\\d{2}-\\d{2}T.*[-+]\\d\\.\\d{2}$' THEN
                    -- Fix malformed timezone offsets like -5.00 or +5.00
                    (REGEXP_REPLACE(created_at::text, '([-+])(\\d)\\.(\\d{2})$', '\\10\\2:\\3'))::timestamp with time zone
                  ELSE
                    -- Try direct conversion for well-formed timestamps
                    CASE
                      WHEN created_at::text ~ '^\\d{4}-\\d{2}-\\d{2}T' THEN created_at::timestamp with time zone
                      WHEN created_at::text ~ '^\\d{4}-\\d{2}-\\d{2} ' THEN created_at::timestamp with time zone
                      ELSE NULL
                    END
                END
            END
        `)

        // Drop old column and rename new one
        await knex.schema.alterTable(table, (t) => {
          t.dropColumn('created_at')
        })

        await knex.schema.alterTable(table, (t) => {
          t.renameColumn('created_at_new', 'created_at')
        })

        console.log(`  ✓ Converted created_at to timestamp with time zone`)
      }
    }

    if (hasUpdatedAt) {
      const columnInfo = await knex.raw(
        `
        SELECT data_type, column_default
        FROM information_schema.columns
        WHERE table_name = ? AND column_name = 'updated_at'
      `,
        [table],
      )

      const currentType = columnInfo.rows[0]?.data_type
      console.log(`  updated_at current type: ${currentType}`)

      if (currentType !== 'timestamp with time zone') {
        // First, add a temporary column with the correct type
        await knex.schema.alterTable(table, (t) => {
          t.timestamp('updated_at_new', { useTz: true })
        })

        // Convert and copy data, handling various formats and malformed timezones
        await knex.raw(`
          UPDATE "${table}" 
          SET updated_at_new = 
            CASE 
              WHEN updated_at IS NULL OR updated_at = '' THEN CURRENT_TIMESTAMP
              WHEN updated_at = '1970-01-01T00:00:00.000Z' THEN CURRENT_TIMESTAMP
              ELSE
                CASE
                  WHEN updated_at::text ~ '^\\d{4}-\\d{2}-\\d{2}T.*[-+]\\d\\.\\d{2}$' THEN
                    -- Fix malformed timezone offsets like -5.00 or +5.00
                    (REGEXP_REPLACE(updated_at::text, '([-+])(\\d)\\.(\\d{2})$', '\\10\\2:\\3'))::timestamp with time zone
                  ELSE
                    -- Try direct conversion for well-formed timestamps
                    CASE
                      WHEN updated_at::text ~ '^\\d{4}-\\d{2}-\\d{2}T' THEN updated_at::timestamp with time zone
                      WHEN updated_at::text ~ '^\\d{4}-\\d{2}-\\d{2} ' THEN updated_at::timestamp with time zone
                      ELSE CURRENT_TIMESTAMP
                    END
                END
            END
        `)

        // Drop old column and rename new one
        await knex.schema.alterTable(table, (t) => {
          t.dropColumn('updated_at')
        })

        await knex.schema.alterTable(table, (t) => {
          t.renameColumn('updated_at_new', 'updated_at')
        })

        // Add default value for updated_at
        await knex.raw(`
          ALTER TABLE "${table}" 
          ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP
        `)

        console.log(`  ✓ Converted updated_at to timestamp with time zone`)
      }
    }
  }

  // Note: User-facing date fields (publication_date, etc.) remain as strings
  // Only created_at and updated_at are converted to proper timestamps

  console.log('\n✅ Timestamp standardization complete!')
}

export async function down(knex: Knex): Promise<void> {
  console.log('Rolling back timestamp standardization...')

  // Convert back to text type for all timestamp columns
  const tablesToRevert = [
    'books',
    'contributors',
    'book_contributors',
    'imprints',
    'users',
    'releases',
    'pricings',
    'issues',
    'endorsements',
    'mentions',
    'refresh_token',
    'signin_history',
    'books-history',
  ]

  for (const table of tablesToRevert) {
    const tableExists = await knex.schema.hasTable(table)
    if (!tableExists) continue

    const hasCreatedAt = await knex.schema.hasColumn(table, 'created_at')
    const hasUpdatedAt = await knex.schema.hasColumn(table, 'updated_at')

    if (hasCreatedAt) {
      await knex.raw(
        `ALTER TABLE "${table}" ALTER COLUMN created_at TYPE text USING created_at::text`,
      )
    }

    if (hasUpdatedAt) {
      await knex.raw(
        `ALTER TABLE "${table}" ALTER COLUMN updated_at TYPE text USING updated_at::text`,
      )
      await knex.raw(
        `ALTER TABLE "${table}" ALTER COLUMN updated_at DROP DEFAULT`,
      )
    }
  }

  console.log('✅ Rollback complete')
}
