import { execSync } from 'child_process'
import fs from 'fs'
import JSON5 from 'json5'
import knex from 'knex'

// Types for the JSON5 revenue splits file
interface RevenueSplitValues {
  fepAmount?: number
  fepPercentage?: number
  pubAmount?: number
  pubPercentage?: number
  remainderToPub?: boolean
}

interface RevenueSplits {
  defaults: RevenueSplitValues
  [incomeAccount: string]: RevenueSplitValues
}

interface BookMeta {
  title: string
  revenueSplits: RevenueSplits
}

interface BooksMetaFile {
  [accountingCode: string]: BookMeta
}

// Database book record
interface BookRecord {
  id: number
  accounting_code: string
  title: string
  status: string
  fep_fixed_share_pb: number
  fep_percentage_share_pb: number
  fep_fixed_share_hc: number
  fep_percentage_share_hc: number
}

// Heroku app name
const HEROKU_APP_NAME = 'fep-bookedge-production'

// Fetch DATABASE_URL from Heroku
function getDatabaseUrl(): string {
  try {
    const url = execSync(
      `heroku config:get DATABASE_URL -a ${HEROKU_APP_NAME}`,
      {
        encoding: 'utf-8',
      },
    ).trim()
    if (!url) {
      throw new Error('DATABASE_URL is empty')
    }
    return url
  } catch {
    console.error(
      `Failed to fetch DATABASE_URL from Heroku app '${HEROKU_APP_NAME}'`,
    )
    console.error('Make sure you are logged in to Heroku (run: heroku login)')
    process.exit(1)
  }
}

// Configure Knex database connection to Heroku Postgres
const databaseUrl = getDatabaseUrl()
const db = knex({
  client: 'pg',
  connection: {
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  },
  debug: false,
})

// Path to the JSON5 file
const JSON5_FILE_PATH =
  '/Users/johnhile/Library/CloudStorage/GoogleDrive-john.hile@frontedgepublishing.com/Shared drives/FEP_Financials/FinancialData/FEP/PublisherStatements/books-meta.json5'

// Extract the prefix from an accounting code (portion before first space)
function getPrefix(accountingCode: string): string {
  const spaceIndex = accountingCode.indexOf(' ')
  return spaceIndex === -1
    ? accountingCode
    : accountingCode.substring(0, spaceIndex)
}

// Check if this is a hardcover entry (has -H in prefix)
function isHardcoverEntry(accountingCode: string): boolean {
  const prefix = getPrefix(accountingCode)
  return prefix.includes('-H')
}

// Get the base prefix for a hardcover entry (remove -H)
function getBasePrefix(accountingCode: string): string {
  const prefix = getPrefix(accountingCode)
  return prefix.replace('-H', '')
}

// Main function
async function updateRevenueSplits() {
  console.log('='.repeat(70))
  console.log('Revenue Splits Update Script')
  console.log(`Target: Heroku Production (${HEROKU_APP_NAME})`)
  console.log('='.repeat(70))
  console.log()

  try {
    // Read and parse the JSON5 file
    console.log(`Reading JSON5 file: ${JSON5_FILE_PATH}`)
    const json5Content = fs.readFileSync(JSON5_FILE_PATH, 'utf-8')
    const booksMeta: BooksMetaFile = JSON5.parse(json5Content)

    const json5Keys = Object.keys(booksMeta)
    console.log(`Found ${json5Keys.length} entries in JSON5 file`)
    console.log()

    // Fetch books from the database that:
    // 1. Have status 'released'
    // 2. Have a print release with full_distribution = true
    // 3. Do not have accounting_code starting with 'MSU-'
    const dbBooks: BookRecord[] = await db('books')
      .select(
        'books.id',
        'books.accounting_code',
        'books.title',
        'books.status',
        'books.fep_fixed_share_pb',
        'books.fep_percentage_share_pb',
        'books.fep_fixed_share_hc',
        'books.fep_percentage_share_hc',
      )
      .where('books.status', 'released')
      .whereNot('books.accounting_code', 'like', 'MSU-%')
      .whereExists(function () {
        this.select(db.raw(1))
          .from('releases')
          .whereRaw('releases.fk_book = books.id')
          .where('releases.release_type', 'print-LSI')
          .where('releases.full_distribution', true)
      })
    console.log(
      `Found ${dbBooks.length} eligible books in BookEdge database (released with full distribution print release)`,
    )
    console.log()

    // Fetch all books for lookup (to differentiate "doesn't exist" vs "not eligible")
    // Exclude MSU-% books from lookup as well
    const allDbBooks: { id: number; accounting_code: string }[] = await db(
      'books',
    )
      .select('id', 'accounting_code')
      .whereNot('accounting_code', 'like', 'MSU-%')
    const allBooksByCode = new Map<string, number>()
    const allBooksByPrefix = new Map<string, number[]>()
    for (const book of allDbBooks) {
      allBooksByCode.set(book.accounting_code, book.id)
      const prefix = getPrefix(book.accounting_code)
      if (!allBooksByPrefix.has(prefix)) {
        allBooksByPrefix.set(prefix, [])
      }
      allBooksByPrefix.get(prefix)!.push(book.id)
    }

    // Create a map of eligible database books by accounting_code for quick lookup
    const dbBooksByCode = new Map<string, BookRecord>()
    for (const book of dbBooks) {
      dbBooksByCode.set(book.accounting_code, book)
    }

    // Create a map for prefix-based lookup (for hardcover matching)
    const dbBooksByPrefix = new Map<string, BookRecord[]>()
    for (const book of dbBooks) {
      const prefix = getPrefix(book.accounting_code)
      if (!dbBooksByPrefix.has(prefix)) {
        dbBooksByPrefix.set(prefix, [])
      }
      dbBooksByPrefix.get(prefix)!.push(book)
    }

    // Track results
    const successfullyUpdatedBooks: {
      accountingCode: string
      title: string
      changes: string[]
    }[] = []
    const discrepancies: string[] = []
    const errors: string[] = []
    const incomeAccountOverrides: string[] = []
    const json5EntriesNotInDb: string[] = []
    const json5EntriesIneligible: string[] = []
    const matchedDbCodes = new Set<string>()

    // Process each entry in the JSON5 file
    for (const [json5Key, meta] of Object.entries(booksMeta)) {
      // Skip MSU- entries entirely
      if (json5Key.startsWith('MSU-')) {
        continue
      }

      const isHardcover = isHardcoverEntry(json5Key)
      const defaults = meta.revenueSplits.defaults

      // Check for income-account-specific overrides
      const overrideKeys = Object.keys(meta.revenueSplits).filter(
        (k) => k !== 'defaults',
      )
      if (overrideKeys.length > 0) {
        incomeAccountOverrides.push(
          `${json5Key}: has overrides for [${overrideKeys.join(', ')}]`,
        )
      }

      // Find matching database book
      let matchedBook: BookRecord | undefined

      if (isHardcover) {
        // For hardcover entries, find the base book by prefix
        const basePrefix = getBasePrefix(json5Key)
        const candidates = dbBooksByPrefix.get(basePrefix) || []

        if (candidates.length === 0) {
          // Check if book exists but isn't eligible
          const allCandidates = allBooksByPrefix.get(basePrefix) || []
          if (allCandidates.length > 0) {
            json5EntriesIneligible.push(`${json5Key} (hardcover)`)
          } else {
            json5EntriesNotInDb.push(
              `${json5Key} (hardcover, no base book with prefix '${basePrefix}')`,
            )
          }
          continue
        } else if (candidates.length > 1) {
          errors.push(
            `${json5Key}: AMBIGUOUS - multiple database books match prefix '${basePrefix}': ${candidates.map((b) => b.accounting_code).join(', ')}`,
          )
          continue
        }
        matchedBook = candidates[0]
      } else {
        // For non-hardcover entries, match by exact accounting_code
        matchedBook = dbBooksByCode.get(json5Key)
        if (!matchedBook) {
          // Check if book exists but isn't eligible
          if (allBooksByCode.has(json5Key)) {
            json5EntriesIneligible.push(json5Key)
          } else {
            json5EntriesNotInDb.push(json5Key)
          }
          continue
        }
      }

      matchedDbCodes.add(matchedBook.accounting_code)

      // Determine which columns to update
      const fixedColumn = isHardcover
        ? 'fep_fixed_share_hc'
        : 'fep_fixed_share_pb'
      const percentColumn = isHardcover
        ? 'fep_percentage_share_hc'
        : 'fep_percentage_share_pb'

      const currentFixed = isHardcover
        ? matchedBook.fep_fixed_share_hc
        : matchedBook.fep_fixed_share_pb
      const currentPercent = isHardcover
        ? matchedBook.fep_percentage_share_hc
        : matchedBook.fep_percentage_share_pb

      const newFixed = defaults.fepAmount ?? currentFixed
      const newPercent = defaults.fepPercentage ?? currentPercent

      // Check for discrepancies (existing values differ from JSON5)
      const hasDiscrepancy =
        (defaults.fepAmount !== undefined && currentFixed !== newFixed) ||
        (defaults.fepPercentage !== undefined && currentPercent !== newPercent)

      if (hasDiscrepancy) {
        // Only report discrepancies where the old value was non-zero
        const discrepancyParts: string[] = []
        if (
          defaults.fepAmount !== undefined &&
          currentFixed !== newFixed &&
          currentFixed !== 0
        ) {
          discrepancyParts.push(
            `${fixedColumn}: ${currentFixed} -> ${newFixed}`,
          )
        }
        if (
          defaults.fepPercentage !== undefined &&
          currentPercent !== newPercent &&
          currentPercent !== 0
        ) {
          discrepancyParts.push(
            `${percentColumn}: ${currentPercent} -> ${newPercent}`,
          )
        }
        if (discrepancyParts.length > 0) {
          discrepancies.push(
            `${matchedBook.accounting_code}: ${discrepancyParts.join(', ')}`,
          )
        }
      }

      // Build update object
      const updates: Record<string, number> = {}
      if (defaults.fepAmount !== undefined) {
        updates[fixedColumn] = newFixed
      }
      if (defaults.fepPercentage !== undefined) {
        updates[percentColumn] = newPercent
      }

      // Perform update if there are changes
      if (Object.keys(updates).length > 0 && hasDiscrepancy) {
        try {
          await db('books').where('id', matchedBook.id).update(updates)

          // Track the successful update with details
          const changes: string[] = []
          if (defaults.fepAmount !== undefined && currentFixed !== newFixed) {
            changes.push(`${fixedColumn}: ${currentFixed} -> ${newFixed}`)
          }
          if (
            defaults.fepPercentage !== undefined &&
            currentPercent !== newPercent
          ) {
            changes.push(`${percentColumn}: ${currentPercent} -> ${newPercent}`)
          }
          successfullyUpdatedBooks.push({
            accountingCode: matchedBook.accounting_code,
            title: matchedBook.title,
            changes,
          })
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err)
          errors.push(
            `${matchedBook.accounting_code}: UPDATE FAILED - ${errorMessage}`,
          )
        }
      }
    }

    // Find eligible database books not in JSON5
    const unmatchedDbBooks: { accounting_code: string; title: string }[] = []
    for (const book of dbBooks) {
      if (!matchedDbCodes.has(book.accounting_code)) {
        unmatchedDbBooks.push({
          accounting_code: book.accounting_code,
          title: book.title,
        })
      }
    }

    // Print results
    console.log('='.repeat(70))
    console.log('RESULTS')
    console.log('='.repeat(70))
    console.log()

    if (successfullyUpdatedBooks.length > 0) {
      console.log(
        `SUCCESSFULLY UPDATED BOOKS (${successfullyUpdatedBooks.length}):`,
      )
      console.log('-'.repeat(40))
      for (const book of successfullyUpdatedBooks) {
        console.log(`  ${book.accountingCode}: ${book.title}`)
        for (const change of book.changes) {
          console.log(`    - ${change}`)
        }
      }
      console.log()
    } else {
      console.log(
        'No books were updated (all values already match or no updates needed)',
      )
      console.log()
    }

    if (discrepancies.length > 0) {
      console.log(`DISCREPANCIES FOUND (${discrepancies.length}):`)
      console.log('-'.repeat(40))
      for (const msg of discrepancies) {
        console.log(`  ${msg}`)
      }
      console.log()
    }

    if (errors.length > 0) {
      console.log(`ERRORS (${errors.length}):`)
      console.log('-'.repeat(40))
      for (const msg of errors) {
        console.log(`  ERROR: ${msg}`)
      }
      console.log()
    }

    if (incomeAccountOverrides.length > 0) {
      console.log(
        `INCOME ACCOUNT OVERRIDES (${incomeAccountOverrides.length}):`,
      )
      console.log('-'.repeat(40))
      console.log(
        '  (These books have income-account-specific splits that cannot be stored in BookEdge)',
      )
      for (const msg of incomeAccountOverrides) {
        console.log(`  INFO: ${msg}`)
      }
      console.log()
    }

    if (json5EntriesNotInDb.length > 0) {
      console.log(
        `JSON5 ENTRIES NOT FOUND IN DATABASE (${json5EntriesNotInDb.length}):`,
      )
      console.log('-'.repeat(40))
      for (const msg of json5EntriesNotInDb) {
        console.log(`  ${msg}`)
      }
      console.log()
    }

    if (json5EntriesIneligible.length > 0) {
      console.log(
        `JSON5 ENTRIES INELIGIBLE - NO FULL DISTRIBUTION PRINT RELEASE (${json5EntriesIneligible.length}):`,
      )
      console.log('-'.repeat(40))
      for (const msg of json5EntriesIneligible) {
        console.log(`  ${msg}`)
      }
      console.log()
    }

    if (unmatchedDbBooks.length > 0) {
      console.log(`DATABASE BOOKS NOT IN JSON5 (${unmatchedDbBooks.length}):`)
      console.log('-'.repeat(40))
      for (const book of unmatchedDbBooks) {
        const codeDisplay =
          book.accounting_code && book.accounting_code.trim()
            ? book.accounting_code
            : '(no accounting code)'
        console.log(`  ${codeDisplay}: ${book.title}`)
      }
      console.log()
    }

    // Summary
    console.log('='.repeat(70))
    console.log('SUMMARY')
    console.log('='.repeat(70))
    console.log(`  JSON5 entries processed: ${json5Keys.length}`)
    console.log(`  Eligible database books: ${dbBooks.length}`)
    console.log(
      `  Books successfully updated: ${successfullyUpdatedBooks.length}`,
    )
    console.log(`  Discrepancies (values changed): ${discrepancies.length}`)
    console.log(`  Errors: ${errors.length}`)
    console.log(`  Income account overrides: ${incomeAccountOverrides.length}`)
    console.log(
      `  JSON5 entries not found in database: ${json5EntriesNotInDb.length}`,
    )
    console.log(
      `  JSON5 entries ineligible (no full dist print): ${json5EntriesIneligible.length}`,
    )
    console.log(
      `  Eligible database books not in JSON5: ${unmatchedDbBooks.length}`,
    )
    console.log()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`FATAL ERROR: ${errorMessage}`)
    if (error instanceof Error && error.stack) {
      console.error(error.stack)
    }
  } finally {
    await db.destroy()
  }
}

// Run the script
updateRevenueSplits()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
