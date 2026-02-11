# BookEdge Import Scripts

This directory contains scripts for importing data into the BookEdge database.

## Author Contact Information Import

The `import-author-contacts.ts` script is designed to import author contact information from a CSV file into the BookEdge database. This is a one-time import process to populate the contributor records with author contact information.

### How it works

1. Reads the CSV file `FEP Author Publisher Staff Address List.csv` from the bookedge-server directory
2. For each author in the file:
   - Identifies books in the database that match the titles listed in the CSV
   - For each matching book, either creates a new contributor record or updates an existing one with author contact information
   - Updates fields like published_name, address, email, phone, and notes
3. Generates a detailed log of all operations, including which books were updated and which were not found

### Usage

To run the script:

```bash
cd /Users/johnhile/dev/bookedge/bookedge-server
pnpm import-authors
```

The script will create a log file `author-import-results.log` in the bookedge-server directory with detailed information about the import process.

### Special Cases

The script handles special book titles that contain commas, such as:
- "Love, Loss and Endurance"
- "Thanks, I Needed That"

For books that couldn't be matched, they will be listed in the log file.