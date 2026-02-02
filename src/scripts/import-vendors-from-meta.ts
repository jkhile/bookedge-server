/**
 * Import Vendors from vendors-meta.json5
 *
 * This script imports vendor data from the vendors-meta.json5 file
 * into the BookEdge vendors table.
 *
 * Usage:
 *   npx ts-node src/scripts/import-vendors-from-meta.ts [environment]
 *
 * Arguments:
 *   environment  Target database: dev (default), staging, or production
 *
 * Examples:
 *   npx ts-node src/scripts/import-vendors-from-meta.ts           # dev database
 *   npx ts-node src/scripts/import-vendors-from-meta.ts dev       # dev database
 *   npx ts-node src/scripts/import-vendors-from-meta.ts staging   # staging database
 *   npx ts-node src/scripts/import-vendors-from-meta.ts production # production database
 */
import { execSync } from 'child_process'
import fs from 'fs'
import JSON5 from 'json5'
import knex, { Knex } from 'knex'

// Types for the vendors-meta.json5 file
interface VendorMeta {
  vendorName?: string
  statementName?: string
  generateIndividualStatements?: boolean
  email?: string // Ignored - will come from QB
}

interface VendorsMetaFile {
  [accountingCode: string]: VendorMeta
}

// Database vendor record
interface VendorRecord {
  id?: number
  code_prefix: string
  vendor_name: string
  statement_name: string
  generate_individual_statements: boolean
  status: string
  notes: string
}

// Environment type
type Environment = 'dev' | 'staging' | 'production'

// Heroku app names for each environment
const HEROKU_APPS: Record<Exclude<Environment, 'dev'>, string> = {
  staging: 'fep-bookedge-staging',
  production: 'fep-bookedge-production',
}

// Path to the JSON5 file
const JSON5_FILE_PATH =
  '/Users/johnhile/Library/CloudStorage/GoogleDrive-john.hile@frontedgepublishing.com/Shared drives/FEP_Financials/FinancialData/FEP/PublisherStatements/vendors-meta.json5'

// Parse environment from command line
function parseEnvironment(): Environment {
  const arg = process.argv[2]?.toLowerCase()

  if (!arg) {
    return 'dev'
  }

  if (arg === 'dev' || arg === 'staging' || arg === 'production') {
    return arg
  }

  // Support legacy --production flag
  if (arg === '--production') {
    return 'production'
  }

  console.error(`Invalid environment: ${arg}`)
  console.error('Valid options: dev, staging, production')
  process.exit(1)
}

const environment = parseEnvironment()

/**
 * Extract vendor code prefix from accounting code
 * e.g., "MUN-00 Jeffrey Munroe Publisher" -> "MUN"
 */
function extractCodePrefix(accountingCode: string): string {
  // Match the prefix before -00 or -NN
  const match = accountingCode.match(/^([A-Z0-9]+)-\d+/)
  if (match) {
    return match[1]
  }
  // Fallback: take everything before first space or dash
  const fallback = accountingCode.split(/[\s-]/)[0]
  return fallback || accountingCode
}

/**
 * Fetch DATABASE_URL from Heroku
 */
function getHerokuDatabaseUrl(appName: string): string {
  try {
    const url = execSync(`heroku config:get DATABASE_URL -a ${appName}`, {
      encoding: 'utf-8',
    }).trim()
    if (!url) {
      throw new Error('DATABASE_URL is empty')
    }
    return url
  } catch {
    console.error(`Failed to fetch DATABASE_URL from Heroku app '${appName}'`)
    console.error('Make sure you are logged in to Heroku (run: heroku login)')
    process.exit(1)
  }
}

/**
 * Get database connection for the specified environment
 */
function getDatabase(env: Environment): Knex {
  if (env === 'dev') {
    console.log('Connecting to LOCAL development database...')
    return knex({
      client: 'pg',
      connection: {
        host: 'localhost',
        database: 'bookedge-server',
        // Add user/password if needed for your local setup
      },
      debug: false,
    })
  }

  const appName = HEROKU_APPS[env]
  console.log(`Connecting to ${env.toUpperCase()} database (${appName})...`)
  const databaseUrl = getHerokuDatabaseUrl(appName)
  return knex({
    client: 'pg',
    connection: {
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    },
    debug: false,
  })
}

/**
 * Main import function
 */
async function importVendors(): Promise<void> {
  console.log('\n=== Import Vendors from vendors-meta.json5 ===')
  console.log(`Target environment: ${environment.toUpperCase()}\n`)

  // Read and parse the JSON5 file
  if (!fs.existsSync(JSON5_FILE_PATH)) {
    console.error(`File not found: ${JSON5_FILE_PATH}`)
    process.exit(1)
  }

  const fileContent = fs.readFileSync(JSON5_FILE_PATH, 'utf-8')
  const vendorsMeta: VendorsMetaFile = JSON5.parse(fileContent)

  console.log(
    `Found ${Object.keys(vendorsMeta).length} vendors in JSON5 file\n`,
  )

  const db = getDatabase(environment)

  try {
    // Track results
    const results = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Process each vendor
    for (const [accountingCode, meta] of Object.entries(vendorsMeta)) {
      const codePrefix = extractCodePrefix(accountingCode)

      // Skip if we couldn't extract a valid prefix
      if (!codePrefix) {
        results.errors.push(`Could not extract prefix from: ${accountingCode}`)
        continue
      }

      // Derive vendor_name from statementName or the accounting code description
      let vendorName = meta.vendorName || ''
      if (!vendorName) {
        // Try to extract from accounting code (e.g., "MUN-00 Jeffrey Munroe Publisher" -> "Jeffrey Munroe Publisher")
        const namePart = accountingCode.replace(/^[A-Z0-9]+-\d+\s*/, '')
        vendorName = namePart || codePrefix
      }

      const vendorRecord: Omit<VendorRecord, 'id'> = {
        code_prefix: codePrefix,
        vendor_name: vendorName,
        statement_name: meta.statementName || '',
        generate_individual_statements:
          meta.generateIndividualStatements || false,
        status: 'active',
        notes: '',
      }

      try {
        // Check if vendor already exists
        const existing = await db('vendors')
          .where('code_prefix', codePrefix)
          .first()

        if (existing) {
          // Update existing record
          await db('vendors').where('code_prefix', codePrefix).update({
            vendor_name: vendorRecord.vendor_name,
            statement_name: vendorRecord.statement_name,
            generate_individual_statements:
              vendorRecord.generate_individual_statements,
            updated_at: db.fn.now(),
          })
          results.updated++
          console.log(`  Updated: ${codePrefix} - ${vendorRecord.vendor_name}`)
        } else {
          // Insert new record
          await db('vendors').insert(vendorRecord)
          results.inserted++
          console.log(`  Inserted: ${codePrefix} - ${vendorRecord.vendor_name}`)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        results.errors.push(`${codePrefix}: ${message}`)
      }
    }

    // Print summary
    console.log('\n=== SUMMARY ===')
    console.log(`Inserted: ${results.inserted}`)
    console.log(`Updated: ${results.updated}`)
    console.log(`Skipped: ${results.skipped}`)

    if (results.errors.length > 0) {
      console.log(`\nErrors (${results.errors.length}):`)
      results.errors.forEach((e) => console.log(`  - ${e}`))
    }

    // Show final count
    const count = await db('vendors').count('* as count').first()
    console.log(`\nTotal vendors in database: ${count?.count}`)
  } finally {
    await db.destroy()
  }
}

// Run the script
importVendors()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
