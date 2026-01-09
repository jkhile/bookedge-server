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
  fep_fixed_share_pb: number
  fep_percentage_share_pb: number
  fep_fixed_share_hc: number
  fep_percentage_share_hc: number
}

// Configure Knex database connection
const db = knex({
  client: 'pg',
  connection: {
    host: 'localhost',
    database: 'bookedge-server',
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

    // Fetch all books from the database
    const dbBooks: BookRecord[] = await db('books').select(
      'id',
      'accounting_code',
      'title',
      'fep_fixed_share_pb',
      'fep_percentage_share_pb',
      'fep_fixed_share_hc',
      'fep_percentage_share_hc',
    )
    console.log(`Found ${dbBooks.length} books in BookEdge database`)
    console.log()

    // Create a map of database books by accounting_code for quick lookup
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
    const updatedBooks: string[] = []
    const discrepancies: string[] = []
    const errors: string[] = []
    const incomeAccountOverrides: string[] = []
    const unmatchedJson5Entries: string[] = []
    const matchedDbCodes = new Set<string>()

    // Process each entry in the JSON5 file
    for (const [json5Key, meta] of Object.entries(booksMeta)) {
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
          unmatchedJson5Entries.push(
            `${json5Key} (hardcover, no base book found with prefix '${basePrefix}')`,
          )
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
          unmatchedJson5Entries.push(`${json5Key} (no exact match in database)`)
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
        const parts: string[] = []
        if (defaults.fepAmount !== undefined && currentFixed !== newFixed) {
          parts.push(`${fixedColumn}: ${currentFixed} -> ${newFixed}`)
        }
        if (
          defaults.fepPercentage !== undefined &&
          currentPercent !== newPercent
        ) {
          parts.push(`${percentColumn}: ${currentPercent} -> ${newPercent}`)
        }
        discrepancies.push(
          `${matchedBook.accounting_code}: ${parts.join(', ')}`,
        )
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
      if (Object.keys(updates).length > 0) {
        try {
          await db('books').where('id', matchedBook.id).update(updates)

          if (hasDiscrepancy) {
            updatedBooks.push(
              `${matchedBook.accounting_code}: updated ${Object.keys(updates).join(', ')}`,
            )
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err)
          errors.push(
            `${matchedBook.accounting_code}: UPDATE FAILED - ${errorMessage}`,
          )
        }
      }
    }

    // Find book IDs that need revenue splits (have releases with full distribution
    // or non-LSI release types). Books with only print-LSI releases where
    // full_distribution = false don't need revenue split information.
    const booksNeedingRevenueSplits = await db('releases')
      .distinct('fk_book')
      .where(function () {
        this.where('full_distribution', true).orWhereNot(
          'release_type',
          'print-LSI',
        )
      })
    const bookIdsNeedingRevenueSplits = new Set(
      booksNeedingRevenueSplits.map((r: { fk_book: number }) => r.fk_book),
    )

    // Find database books not in JSON5 (excluding books that only have
    // non-distributed LSI releases)
    const unmatchedDbBooks: { accounting_code: string; title: string }[] = []
    let skippedNonDistributedCount = 0
    for (const book of dbBooks) {
      if (!matchedDbCodes.has(book.accounting_code)) {
        // Skip books that don't need revenue splits (only have non-distributed LSI releases)
        if (!bookIdsNeedingRevenueSplits.has(book.id)) {
          skippedNonDistributedCount++
          continue
        }
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

    if (updatedBooks.length > 0) {
      console.log(`UPDATED (${updatedBooks.length}):`)
      console.log('-'.repeat(40))
      for (const msg of updatedBooks) {
        console.log(`  ${msg}`)
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

    if (unmatchedJson5Entries.length > 0) {
      console.log(
        `JSON5 ENTRIES NOT IN DATABASE (${unmatchedJson5Entries.length}):`,
      )
      console.log('-'.repeat(40))
      for (const msg of unmatchedJson5Entries) {
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
    console.log(`  Database books: ${dbBooks.length}`)
    console.log(`  Books updated: ${updatedBooks.length}`)
    console.log(`  Discrepancies (values changed): ${discrepancies.length}`)
    console.log(`  Errors: ${errors.length}`)
    console.log(`  Income account overrides: ${incomeAccountOverrides.length}`)
    console.log(
      `  JSON5 entries not in database: ${unmatchedJson5Entries.length}`,
    )
    console.log(`  Database books not in JSON5: ${unmatchedDbBooks.length}`)
    if (skippedNonDistributedCount > 0) {
      console.log(
        `  Skipped (non-distributed LSI only): ${skippedNonDistributedCount}`,
      )
    }
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
