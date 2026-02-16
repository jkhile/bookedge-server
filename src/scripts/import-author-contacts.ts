import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse'
import knex from 'knex'
import type { Knex } from 'knex'
import { format } from 'date-fns'

// Define interfaces
interface AuthorData {
  salutation: string
  firstName: string
  lastName: string
  address1: string
  address2: string
  city: string
  state: string
  zip: string
  bookTitles: string
  email: string
  phone1: string
  phone2: string
  notes: string
}

interface BookRecord {
  id: number
  title: string
}

interface ContributorRecord {
  id?: number
  fk_book: number
  contributor_role: string
  published_name: string
  email: string
  address: string
  phone: string
  notes: string
  fk_created_by: number
  fk_updated_by: number
  created_at: string
  updated_at: string
}

interface ImportResult {
  book: BookRecord
  author: string
  action: 'added' | 'updated'
  details: string
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

// Parse CSV file
async function parseCSV(filePath: string): Promise<AuthorData[]> {
  const csvData = fs.readFileSync(filePath, 'utf8')

  return new Promise((resolve, reject) => {
    parse(
      csvData,
      {
        columns: [
          'salutation',
          'firstName',
          'lastName',
          'company',
          'address1',
          'address2',
          'city',
          'state',
          'zip',
          'bookTitles',
          'publicationDay',
          'notes',
          'email',
          'phone1',
          'phone2',
        ],
        skip_empty_lines: true,
        from_line: 2, // Skip header row
      },
      (err, records: AuthorData[]) => {
        if (err) {
          reject(err)
          return
        }
        resolve(records)
      },
    )
  })
}

// Find books matching the title from CSV
async function findMatchingBooks(
  title: string,
  db: Knex,
): Promise<BookRecord[]> {
  // Handle special case titles with commas that are in the database
  const specialTitles = [
    'Love, Loss and Endurance',
    'Thanks, I Needed That',
    'Jesus Christ, Movie Star',
  ]

  const specialMatch = specialTitles.find((specialTitle) =>
    specialTitle.toLowerCase().startsWith(title.toLowerCase().trim()),
  )

  if (specialMatch) {
    const books = await db('books')
      .select('id', 'title')
      .whereRaw('LOWER(title) LIKE ?', [`${specialMatch.toLowerCase()}%`])
    return books
  }

  // Regular case - look for books that start with the given title
  return db('books')
    .select('id', 'title')
    .whereRaw('LOWER(title) LIKE ?', [`${title.toLowerCase().trim()}%`])
}

// Find existing contributor for a book
async function findExistingContributor(
  bookId: number,
  db: Knex,
): Promise<ContributorRecord | undefined> {
  const contributor = await db('contributors')
    .select('*')
    .where({
      fk_book: bookId,
      contributor_role: 'Author',
    })
    .first()

  return contributor
}

// Create or update contributor record
async function createOrUpdateContributor(
  bookId: number,
  authorData: AuthorData,
  db: Knex,
): Promise<ImportResult> {
  // Format author data
  // const publishedName = [
  //   authorData.salutation,
  //   authorData.firstName,
  //   authorData.lastName,
  // ]
  //   .filter(Boolean)
  //   .join(' ')
  //   .trim()

  const publishedName = `${authorData.lastName}, ${(authorData.salutation + ' ' + authorData.firstName).trim()}`

  const address = [
    authorData.address1,
    authorData.address2,
    [authorData.city, authorData.state].filter(Boolean).join(', '),
    authorData.zip,
  ]
    .filter(Boolean)
    .join(', ')
    .trim()

  const phone = [authorData.phone1, authorData.phone2]
    .filter(Boolean)
    .join(', ')
    .trim()

  const now = new Date()
  const timestamp = now.toISOString()

  // Check if contributor already exists
  const existingContributor = await findExistingContributor(bookId, db)

  // Get book title for logging
  const book = await db('books')
    .select('id', 'title')
    .where('id', bookId)
    .first()

  if (!existingContributor) {
    // Create new contributor
    const newContributor: ContributorRecord = {
      fk_book: bookId,
      contributor_role: 'Author',
      published_name: publishedName,
      email: authorData.email || '',
      address: address || '',
      phone: phone || '',
      notes: authorData.notes || '',
      fk_created_by: 2,
      fk_updated_by: 2, // As per requirements
      created_at: timestamp,
      updated_at: timestamp,
    }

    await db('contributors').insert(newContributor)

    return {
      book,
      author: publishedName,
      action: 'added',
      details: `Added new Author record for book ID ${bookId}`,
    }
  } else {
    // Update existing contributor
    const updates: Partial<ContributorRecord> = {
      fk_updated_by: 2,
      updated_at: timestamp,
    }

    // Only update fields if they're empty in the database or missing
    if (!existingContributor.published_name) {
      updates.published_name = publishedName
    }

    if (!existingContributor.email && authorData.email) {
      updates.email = authorData.email
    }

    if (!existingContributor.address && address) {
      updates.address = address
    }

    if (!existingContributor.phone && phone) {
      updates.phone = phone
    }

    // For notes, append with newline if there's existing content
    if (authorData.notes) {
      if (existingContributor.notes) {
        updates.notes = `${existingContributor.notes}\n${authorData.notes}`
      } else {
        updates.notes = authorData.notes
      }
    }

    // Only update if we have changes
    if (Object.keys(updates).length > 2) {
      // More than just updated_by and updated_at
      await db('contributors')
        .where('id', existingContributor.id)
        .update(updates)

      return {
        book,
        author: publishedName,
        action: 'updated',
        details: `Updated Author record ${existingContributor.id} for book ID ${bookId}`,
      }
    }

    return {
      book,
      author: publishedName,
      action: 'updated',
      details: 'No changes needed (all fields already populated)',
    }
  }
}

// Main function to run the import
async function importAuthorData() {
  try {
    const filePath = path.resolve(
      __dirname,
      '../../FEP Author Publisher Staff Address List.csv',
    )

    // Create log file
    const logFile = path.resolve(__dirname, '../../author-import-results.log')
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
    fs.writeFileSync(logFile, `Author Import Log - ${timestamp}\n\n`)

    console.log('Starting import process...')
    fs.appendFileSync(logFile, 'Starting import process...\n\n')

    // Parse CSV data
    const authorRecords = await parseCSV(filePath)
    console.log(`Found ${authorRecords.length} records in CSV file`)
    fs.appendFileSync(
      logFile,
      `Found ${authorRecords.length} records in CSV file\n\n`,
    )

    const unmatchedTitles: string[] = []
    const results: ImportResult[] = []

    // Process each author
    for (const author of authorRecords) {
      if (!author.bookTitles) {
        fs.appendFileSync(
          logFile,
          `SKIPPED: No book titles for ${author.firstName} ${author.lastName}\n`,
        )
        continue
      }

      // Parse book titles function
      function parseBookTitles(titleString: string): string[] {
        // Handle special case titles with commas that are in the database
        const specialTitles = [
          'Love, Loss and Endurance',
          'Thanks, I Needed That',
          'Jesus Christ, Movie Star',
          'Beacon of Justice, Community, and Hope',
        ]

        const bookTitles: string[] = []
        let tempTitles = titleString

        // Check for special titles first
        for (const specialTitle of specialTitles) {
          if (tempTitles.includes(specialTitle)) {
            bookTitles.push(specialTitle)
            tempTitles = tempTitles.replace(specialTitle, '')
          }
        }

        // Process remaining titles
        const remainingTitles = tempTitles
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)

        return [...bookTitles, ...remainingTitles]
      }

      // Parse the book titles
      const bookTitles = parseBookTitles(author.bookTitles)

      for (const title of bookTitles) {
        const matchingBooks = await findMatchingBooks(title, db)

        if (matchingBooks.length === 0) {
          unmatchedTitles.push(
            `${title} (${author.firstName} ${author.lastName})`,
          )
          fs.appendFileSync(
            logFile,
            `UNMATCHED: "${title}" for ${author.firstName} ${author.lastName}\n`,
          )
          continue
        }

        // Update each matching book
        for (const book of matchingBooks) {
          const result = await createOrUpdateContributor(book.id, author, db)
          results.push(result)

          const logEntry = `${result.action.toUpperCase()}: ${result.author} -> "${result.book.title}" (ID: ${result.book.id}) - ${result.details}\n`
          fs.appendFileSync(logFile, logEntry)
        }
      }
    }

    // Log summary
    const added = results.filter((r) => r.action === 'added').length
    const updated = results.filter((r) => r.action === 'updated').length

    const summary = `
IMPORT SUMMARY
-------------
Total records processed: ${authorRecords.length}
Books updated with author info: ${results.length}
New contributor records: ${added}
Updated contributor records: ${updated}
Unmatched book titles: ${unmatchedTitles.length}

Unmatched titles:
${unmatchedTitles.join('\n')}
`

    console.log(summary)
    fs.appendFileSync(logFile, summary)
    console.log(`Import complete. Results logged to ${logFile}`)
  } catch (error) {
    console.error('Import failed:', error)
  } finally {
    // Close database connection
    await db.destroy()
  }
}

// Run the import
importAuthorData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
