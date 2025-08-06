import { parse } from 'json2csv'
import { writeFileSync } from 'fs'
import { join } from 'path'
import knex from 'knex'

// Script to export all contributors data to CSV before migration
async function exportContributorsToCSV() {
  const environment = process.env.NODE_ENV || 'development'
  const isDeployScript = process.env.DEPLOY_SCRIPT === 'true'

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set')
    console.error('Please set DATABASE_URL before running this script')
    console.error(
      'Example: DATABASE_URL=postgres://localhost/bookedge-server tsx scripts/export-contributors-backup.ts',
    )
    process.exit(1)
  }

  // Import knexfile using require for CommonJS compatibility
  const config = require('../knexfile')
  const db = knex(config)

  try {
    if (isDeployScript) {
      console.log(
        `📦 Creating contributors backup for ${environment} deployment...`,
      )
    } else {
      console.log(`Exporting contributors from ${environment} environment...`)
    }

    // Get all contributors with their associated book information
    const contributors = await db('contributors')
      .leftJoin('books', 'contributors.fk_book', 'books.id')
      .select(
        'contributors.*',
        'books.title as book_title',
        'books.isbn_paperback',
        'books.isbn_hardcover',
        'books.isbn_epub',
      )
      .orderBy(['contributors.published_name', 'contributors.updated_at'])

    if (contributors.length === 0) {
      console.log('No contributors found in the database.')
      return
    }

    // Define CSV fields
    const fields = [
      'id',
      'published_name',
      'legal_name',
      'contributor_role',
      'book_title',
      'isbn_paperback',
      'isbn_hardcover',
      'isbn_epub',
      'biography',
      'biography_finalized',
      'email',
      'public_email',
      'address',
      'phone',
      'wikipedia_page',
      'amazon_author_page',
      'author_website',
      'twitter',
      'substack',
      'bluesky',
      'instagram',
      'facebook',
      'linkedin',
      'goodreads',
      'tiktok',
      'notes',
      'created_at',
      'updated_at',
      'fk_created_by',
      'fk_updated_by',
    ]

    // Convert to CSV
    const csv = parse(contributors, { fields })

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `contributors-backup-${environment}-${timestamp}.csv`
    const filepath = join(__dirname, '..', 'backups', filename)

    // Ensure backups directory exists
    const fs = await import('fs')
    const backupsDir = join(__dirname, '..', 'backups')
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true })
    }

    // Write CSV file
    writeFileSync(filepath, csv)

    if (isDeployScript) {
      console.log(
        `✅ Contributors backup created: ${filename} (${contributors.length} records)`,
      )
    } else {
      console.log(
        `✅ Exported ${contributors.length} contributors to: ${filepath}`,
      )
    }

    // Also generate a summary of duplicates
    const duplicatesQuery = await db('contributors')
      .select('published_name')
      .count('* as count')
      .groupBy('published_name')
      .havingRaw('count(*) > ?', [1])
      .orderBy('count', 'desc')

    if (!isDeployScript) {
      // Only show detailed duplicate analysis when run manually
      if (duplicatesQuery.length > 0) {
        console.log('\n📊 Duplicate Contributors Summary:')
        console.log('Published Name | Count')
        console.log('---------------|-------')
        duplicatesQuery.forEach((dup) => {
          console.log(`${dup.published_name} | ${dup.count}`)
        })

        const totalDuplicates = duplicatesQuery.reduce(
          (sum, dup) => sum + (Number(dup.count) - 1),
          0,
        )
        console.log(
          `\nTotal duplicate records that will be removed: ${totalDuplicates}`,
        )
      } else {
        console.log('\n✨ No duplicate contributors found.')
      }
    } else if (duplicatesQuery.length > 0) {
      const totalDuplicates = duplicatesQuery.reduce(
        (sum, dup) => sum + (Number(dup.count) - 1),
        0,
      )
      console.log(`🔄 Will deduplicate ${totalDuplicates} contributor records`)
    }
  } catch (error) {
    console.error('Error exporting contributors:', error)
    process.exit(1)
  } finally {
    await db.destroy()
  }
}

// Run the export
exportContributorsToCSV()
