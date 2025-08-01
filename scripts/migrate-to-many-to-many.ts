#!/usr/bin/env node
import knex from 'knex'
import { execSync } from 'child_process'
import { join } from 'path'

// Script to safely migrate to many-to-many relationship
// Note: For staging/production, use deploy-db-changes.zsh instead
async function migrateToManyToMany() {
  const environment = process.env.NODE_ENV || 'development'

  if (environment === 'production' || environment === 'staging') {
    console.log(
      `⚠️  For ${environment} environment, use deploy-db-changes.zsh instead`,
    )
    console.log(`Run: ./deploy-db-changes.zsh ${environment}`)
    process.exit(1)
  }

  console.log(
    `🚀 Starting migration to many-to-many relationship in ${environment} environment`,
  )

  try {
    // Step 1: Export backup
    console.log('\n📦 Step 1: Creating backup of current contributors...')
    execSync('node scripts/export-contributors-backup.ts', {
      stdio: 'inherit',
      cwd: join(__dirname, '..'),
    })

    // Step 2: Run migrations
    console.log('\n🔄 Step 2: Running database migrations...')
    execSync('pnpm migrate', {
      stdio: 'inherit',
      cwd: join(__dirname, '..'),
    })

    // Step 3: Verify migration
    console.log('\n✅ Step 3: Verifying migration...')

    // Check for DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.error('\n❌ DATABASE_URL environment variable is not set')
      console.error('Please set DATABASE_URL before running this script')
      console.error(
        'Example: DATABASE_URL=postgres://localhost/bookedge-server tsx scripts/migrate-to-many-to-many.ts',
      )
      process.exit(1)
    }

    const config = require('../knexfile')
    const db = knex(config)

    // Check that book_contributors table exists
    const hasBookContributors = await db.schema.hasTable('book_contributors')
    if (!hasBookContributors) {
      throw new Error('book_contributors table was not created!')
    }

    // Check that fk_book was removed from contributors
    const contributorsColumns = await db('information_schema.columns')
      .where({ table_name: 'contributors', column_name: 'fk_book' })
      .select('column_name')

    if (contributorsColumns.length > 0) {
      throw new Error('fk_book column was not removed from contributors table!')
    }

    // Count records in both tables
    const contributorsCount = await db('contributors').count('* as count')
    const bookContributorsCount =
      await db('book_contributors').count('* as count')

    console.log(`\n📊 Migration Results:`)
    console.log(`- Contributors (deduplicated): ${contributorsCount[0].count}`)
    console.log(
      `- Book-Contributor relationships: ${bookContributorsCount[0].count}`,
    )

    await db.destroy()

    console.log('\n✨ Migration completed successfully!')
    console.log('\n⚠️  Next steps:')
    console.log('1. Test the application thoroughly in development')
    console.log('2. Update client components to use the new structure')
    console.log(
      '3. Deploy code to staging, then run: ./deploy-db-changes.zsh staging',
    )
    console.log(
      '4. After staging testing, deploy to production and run: ./deploy-db-changes.zsh production',
    )
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    console.error('\nTo rollback, run: pnpm migrate:down')
    process.exit(1)
  }
}

// Run the migration
migrateToManyToMany()
