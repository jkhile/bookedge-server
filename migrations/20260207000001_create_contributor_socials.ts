import type { Knex } from 'knex'

const SOCIAL_COLUMNS = [
  'twitter',
  'bluesky',
  'substack',
  'instagram',
  'facebook',
  'linkedin',
  'goodreads',
  'tiktok',
] as const

// Map old column names to display-friendly platform labels
const COLUMN_TO_PLATFORM: Record<string, string> = {
  twitter: 'X',
  bluesky: 'Bluesky',
  substack: 'Substack',
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  goodreads: 'Goodreads',
  tiktok: 'TikTok',
}

export async function up(knex: Knex): Promise<void> {
  // 1. Create contributor_socials table
  await knex.schema.createTable('contributor_socials', (table) => {
    table.increments('id').primary()

    table.integer('contributor_id').notNullable()
    table
      .foreign('contributor_id')
      .references('id')
      .inTable('contributors')
      .onDelete('CASCADE')

    table.string('platform', 50).notNullable()
    table.text('url').notNullable()

    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())

    table.index(['contributor_id'], 'idx_contributor_socials_contributor')
  })

  // 2. Migrate existing data from contributor columns
  const contributors = await knex('contributors').select([
    'id',
    ...SOCIAL_COLUMNS,
  ])

  const rows: { contributor_id: number; platform: string; url: string }[] = []

  for (const contributor of contributors) {
    for (const column of SOCIAL_COLUMNS) {
      const value = contributor[column]
      if (value && typeof value === 'string' && value.trim() !== '') {
        rows.push({
          contributor_id: contributor.id,
          platform: COLUMN_TO_PLATFORM[column],
          url: value.trim(),
        })
      }
    }
  }

  if (rows.length > 0) {
    // Insert in batches of 500 to avoid exceeding query limits
    const batchSize = 500
    for (let i = 0; i < rows.length; i += batchSize) {
      await knex('contributor_socials').insert(rows.slice(i, i + batchSize))
    }
  }

  // 3. Drop the old social media columns from contributors
  await knex.schema.alterTable('contributors', (table) => {
    for (const column of SOCIAL_COLUMNS) {
      table.dropColumn(column)
    }
  })
}

export async function down(knex: Knex): Promise<void> {
  // 1. Re-add the social media columns to contributors
  await knex.schema.alterTable('contributors', (table) => {
    for (const column of SOCIAL_COLUMNS) {
      table.string(column).defaultTo('')
    }
  })

  // 2. Copy data back from contributor_socials to contributor columns
  const platformToColumn: Record<string, string> = Object.fromEntries(
    Object.entries(COLUMN_TO_PLATFORM).map(([col, platform]) => [
      platform,
      col,
    ]),
  )

  const socialLinks = await knex('contributor_socials').select(
    'contributor_id',
    'platform',
    'url',
  )

  for (const link of socialLinks) {
    const column = platformToColumn[link.platform]
    if (column) {
      await knex('contributors')
        .where('id', link.contributor_id)
        .update({ [column]: link.url })
    }
  }

  // 3. Drop the contributor_socials table
  await knex.schema.dropTableIfExists('contributor_socials')
}
