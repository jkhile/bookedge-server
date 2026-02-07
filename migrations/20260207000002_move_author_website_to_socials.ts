import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // 1. Migrate existing author_website data to contributor_socials
  const contributors = await knex('contributors')
    .select(['id', 'author_website'])
    .whereNotNull('author_website')
    .andWhere('author_website', '!=', '')

  const rows: { contributor_id: number; platform: string; url: string }[] = []

  for (const contributor of contributors) {
    const value = contributor.author_website
    if (value && typeof value === 'string' && value.trim() !== '') {
      rows.push({
        contributor_id: contributor.id,
        platform: 'Author Website',
        url: value.trim(),
      })
    }
  }

  if (rows.length > 0) {
    const batchSize = 500
    for (let i = 0; i < rows.length; i += batchSize) {
      await knex('contributor_socials').insert(rows.slice(i, i + batchSize))
    }
  }

  // 2. Drop the author_website column from contributors
  await knex.schema.alterTable('contributors', (table) => {
    table.dropColumn('author_website')
  })
}

export async function down(knex: Knex): Promise<void> {
  // 1. Re-add the author_website column to contributors
  await knex.schema.alterTable('contributors', (table) => {
    table.text('author_website').defaultTo('')
  })

  // 2. Copy 'Author Website' entries back to the column
  const socialLinks = await knex('contributor_socials')
    .select('contributor_id', 'url')
    .where('platform', 'Author Website')

  for (const link of socialLinks) {
    await knex('contributors')
      .where('id', link.contributor_id)
      .update({ author_website: link.url })
  }

  // 3. Delete the 'Author Website' rows from contributor_socials
  await knex('contributor_socials').where('platform', 'Author Website').delete()
}
