import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse'

// Parse CSV file
async function parseCSV(filePath: string) {
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
      (err, records) => {
        if (err) {
          reject(err)
          return
        }
        resolve(records)
      },
    )
  })
}

// Test title parsing
function parseBookTitles(titleString: string): string[] {
  // Handle special case titles with commas that are in the database
  const specialTitles = ['Love, Loss and Endurance', 'Thanks, I Needed That']

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

async function testParsing() {
  try {
    const filePath = path.resolve(
      __dirname,
      '../../FEP Author Publisher Staff Address List.csv',
    )

    console.log('Testing CSV parsing...')
    const records = (await parseCSV(filePath)) as any[]
    console.log(`Found ${records.length} records in CSV file`)

    // Test parsing a few specific book titles
    const testCases = [
      'Love, Loss and Endurance',
      "Thanks, I Needed That, Life Doesn't Get Any Better Than This",
    ]

    console.log('\nTesting title parsing:')
    for (const testCase of testCases) {
      console.log(`\nOriginal: "${testCase}"`)
      const parsed = parseBookTitles(testCase)
      console.log('Parsed:', parsed)
    }

    // Print a few sample records
    console.log('\nSample records:')
    for (let i = 0; i < Math.min(3, records.length); i++) {
      console.log(`\nRecord ${i + 1}:`)
      console.log(records[i])
    }
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testParsing()
  .then(() => console.log('Test complete'))
  .catch((err) => console.error('Error:', err))
