# Database Deployment Prompt

Use this prompt to deploy database changes to staging or production environments.

## For Staging Deployment

```
Please deploy the production database with pending migrations to staging using the following process:

1. Drop the local 'bookedge-server' database (terminate active connections if needed)
2. Pull the production database from Heroku to local
3. Check for and fix any corrupted migrations:
   - Compare knex_migrations table entries with migration files in migrations/
   - Remove any migration entries from the database that don't have corresponding files
   - Report which migrations were removed and why
4. Run pending migrations locally (pnpm migrate)
5. Reset the staging database on Heroku (fep-bookedge-staging)
6. Push the updated local database to staging
7. Verify the deployment by checking:
   - Latest migration batch in staging
   - Any new tables/columns were created successfully

Please create a todo list to track progress through these steps.
```

## For Production Deployment

```
Please deploy the staging database with all migrations to production using the following process:

1. Drop the local 'bookedge-server' database (terminate active connections if needed)
2. Pull the STAGING database from Heroku to local (fep-bookedge-staging)
3. Verify the database state:
   - Check that all expected migrations are present
   - List the latest batch of migrations
   - Confirm no corrupted migration entries exist
4. Create a backup verification:
   - Show the current migration count in production
   - Show the current migration count in the local database
   - Confirm we're moving forward (local has more migrations than production)
5. Reset the production database on Heroku (fep-bookedge-production) - WAIT FOR MY CONFIRMATION BEFORE THIS STEP
6. Push the local database to production
7. Verify the production deployment:
   - Latest migration batch in production
   - Confirm all new tables/columns exist
   - Show migration count matches what we pushed

Please create a todo list to track progress through these steps.

IMPORTANT: Pause and wait for my explicit confirmation before resetting the production database (step 5).
```

## Quick Reference

### Environment Details
- **Production App**: `fep-bookedge-production`
- **Staging App**: `fep-bookedge-staging`
- **Local Database**: `bookedge-server`

### Key Commands
- Drop local DB: `dropdb bookedge-server`
- Terminate connections: `psql -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'bookedge-server' AND pid <> pg_backend_pid();"`
- Pull from Heroku: `heroku pg:pull DATABASE_URL bookedge-server --app=[app-name]`
- Run migrations: `pnpm migrate`
- Reset Heroku DB: `heroku pg:reset --app=[app-name] --confirm [app-name]`
- Push to Heroku: `heroku pg:push bookedge-server DATABASE_URL --app=[app-name]`
- Check migrations: `psql bookedge-server -c "SELECT id, name, batch FROM knex_migrations ORDER BY id;"`
- Heroku SQL: `heroku pg:psql --app=[app-name] -c "[sql-command]"`

### Common Issues

**Corrupted Migrations**: If migrations exist in the database but not as files, remove them:
```sql
DELETE FROM knex_migrations WHERE name IN ('filename1.ts', 'filename2.ts');
```

**Active Connections**: If dropdb fails, terminate connections first (see command above)

**Heroku Errors**: The following errors during pull/push are expected and harmless:
- `_heroku schema does not exist`
- `must be owner of extension pg_stat_statements`
- Event trigger errors related to Heroku extensions

### Migration Verification Queries

Check for migrations in DB without files:
```bash
psql bookedge-server -c "SELECT id, name FROM knex_migrations WHERE name NOT IN (SELECT unnest(ARRAY[$(ls migrations/*.ts | xargs -n1 basename | sed "s/^/'/;s/$/',/" | tr '\n' ' ' | sed 's/, *$//')]))"
```

List migration files not in DB:
```bash
comm -23 <(ls migrations/*.ts | xargs -n1 basename | sort) <(psql -t bookedge-server -c "SELECT name FROM knex_migrations ORDER BY name;" | tr -d ' ')
```

Show latest migrations:
```sql
SELECT id, name, migration_time, batch
FROM knex_migrations
WHERE batch = (SELECT MAX(batch) FROM knex_migrations)
ORDER BY id;
```
