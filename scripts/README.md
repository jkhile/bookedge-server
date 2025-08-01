# BookEdge Migration Scripts

## Contributors Many-to-Many Migration

This directory contains scripts for migrating from a one-to-many to many-to-many relationship between books and contributors.

### Scripts Overview

#### `export-contributors-backup.ts`
Exports all contributors to CSV format with book information.

**Usage:**
```bash
# Manual export (shows detailed duplicate analysis)
node scripts/export-contributors-backup.ts

# Used by deploy script (minimal output)
DEPLOY_SCRIPT=true node scripts/export-contributors-backup.ts
```

**Output:** Creates `backups/contributors-backup-[environment]-[timestamp].csv`

#### `migrate-to-many-to-many.ts`
Automated migration script for development environment only.

**Usage:**
```bash
# Development only (staging/production will be rejected)
node scripts/migrate-to-many-to-many.ts
```

**What it does:**
1. Creates contributor backup
2. Runs database migrations
3. Verifies migration success
4. Shows next steps

#### `deploy-db-changes.zsh` (external script)
Used for staging and production deployments.

**Usage:**
```bash
# Deploy to staging
./deploy-db-changes.zsh staging

# Deploy to production  
./deploy-db-changes.zsh production
```

**What it does:**
1. Pulls production DB locally
2. Runs `export-contributors-backup.ts` automatically
3. Runs pending migrations locally
4. Pushes updated DB to target environment

### Migration Workflow

1. **Development:**
   ```bash
   node scripts/migrate-to-many-to-many.ts
   ```

2. **Staging:**
   ```bash
   # Deploy code first, then:
   ./deploy-db-changes.zsh staging
   ```

3. **Production:**
   ```bash
   # Deploy code first, then:
   ./deploy-db-changes.zsh production
   ```

### Safety Features

- Development script prevents running on staging/production
- All scripts create automatic backups
- Migration includes verification steps
- Rollback instructions provided on failure

### File Locations

- **Backups:** `bookedge-server/backups/`
- **Migrations:** `bookedge-server/migrations/`
- **Scripts:** `bookedge-server/scripts/`

### Environment Variables

- `DATABASE_URL`: **Required** - PostgreSQL connection string (e.g., `postgres://user:password@localhost:5432/bookedge-server`)
- `NODE_ENV`: Sets target environment (development/staging/production)
- `DEPLOY_SCRIPT`: When set to 'true', reduces output verbosity for deploy script integration

### Running Scripts Manually

When running scripts manually, you must provide the DATABASE_URL:

```bash
# For local development (no authentication)
DATABASE_URL=postgres://localhost/bookedge-server tsx scripts/export-contributors-backup.ts
DATABASE_URL=postgres://localhost/bookedge-server tsx scripts/migrate-to-many-to-many.ts

# Alternative format that also works
DATABASE_URL=postgresql://localhost/bookedge-server tsx scripts/export-contributors-backup.ts

# The deploy-db-changes.zsh script sets this automatically when pulling from Heroku
```

**Note:** The local development database is typically named `bookedge-server`. If you're using a different database name, adjust the DATABASE_URL accordingly.