# BookEdge Server Scripts

All shell scripts are located in the `scripts/` directory. TypeScript scripts are in `src/scripts/` and run via `tsx`.

## Shell Scripts (`scripts/`)

### deploy-db-changes.zsh

Deploys database schema changes to staging or production by pulling the production database locally, running migrations, then pushing the migrated database back up.

```bash
./scripts/deploy-db-changes.zsh [staging|production]
```

**Warning**: This causes brief downtime while the remote database is reset and reloaded.

### pulldb.zsh

Pulls the production database from Heroku to your local `bookedge-server` database. Drops the existing local database first.

```bash
./scripts/pulldb.zsh
# or via pnpm:
pnpm pull-db
```

### setup-test-server.zsh

Creates the `bookedge-test` database by dumping the schema from the local `bookedge-server` database and applying it to a fresh `bookedge-test` database.

```bash
./scripts/setup-test-server.zsh
# or via pnpm (also inserts test users):
pnpm make-test-db
```

### load-db-fixtures.zsh

Loads SQL fixture files (matching `insert-*.sql`) from the client's cypress fixtures directory into the local `bookedge-server` database.

```bash
./scripts/load-db-fixtures.zsh
```

### backup-heroku-db.sh

Creates a SQL backup of the Heroku PostgreSQL database with automatic compression and cleanup of old backups (keeps last 10).

```bash
./scripts/backup-heroku-db.sh
```

Environment variables:
- `HEROKU_APP_NAME` (default: `fep-bookedge-production`)
- `BACKUP_DIR` (default: `./backups`)

### restore-heroku-db.sh

Restores a SQL backup file to the Heroku PostgreSQL database. Supports both plain `.sql` and compressed `.sql.gz` files. Prompts for confirmation before proceeding.

```bash
./scripts/restore-heroku-db.sh <backup_file>
# Example:
./scripts/restore-heroku-db.sh backups/bookedge_20250101_120000.sql
```

## TypeScript Scripts (`src/scripts/`)

These scripts are run via `tsx` and connect directly to the database. Most have corresponding `pnpm` shortcuts.

### import-author-contacts.ts

Imports author contact information from a CSV file (`FEP Author Publisher Staff Address List.csv`) into the contributors table. One-time import script.

```bash
pnpm import-authors
```

### backup-heroku-db.ts

TypeScript version of the Heroku database backup script with the same functionality as the shell version.

```bash
pnpm backup-heroku-db
```

### restore-heroku-db.ts

TypeScript version of the Heroku database restore script with the same functionality as the shell version.

```bash
pnpm restore-heroku-db
```

### test-parser.ts

Parses and validates CSV data for testing import logic.

```bash
pnpm test-parser
```

### import-vendors-from-meta.ts

Imports vendor data from `vendors-meta.json5` into the vendors table. Supports targeting different environments.

```bash
npx ts-node src/scripts/import-vendors-from-meta.ts [dev|staging|production]
```

### update-revenue-splits.ts

Updates revenue split configurations in the database from a JSON5 configuration file.

```bash
pnpm update-revenue-splits
```

### cleanup-refresh-tokens.ts

Cleans up expired refresh tokens from the database. Referenced in package.json but the script file may need to be recreated.

```bash
pnpm cleanup-tokens
```
