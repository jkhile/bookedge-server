# BookEdge Server Deployment Guide

## Overview

BookEdge server is a Feathers.js application deployed on **Heroku** (Heroku-24 stack) with a **PostgreSQL** database. The client is deployed separately to **Netlify**.

### Environments

| Environment | Heroku App | Git Remote | Database |
|-------------|-----------|------------|----------|
| Staging | `fep-bookedge-staging` | `staging` | Heroku Postgres |
| Production | `fep-bookedge-production` | `production` | Heroku Postgres |

### Prerequisites

- Heroku CLI installed and authenticated
- Git with remotes `origin`, `staging`, and `production` configured
- Node.js and pnpm installed
- PostgreSQL installed locally
- Access to both Heroku applications

### Configuration

Environment configuration is managed in the `config` directory:
- `default.json` — base configuration
- `production.json` — production-specific overrides
- `test.json` — test environment settings
- `custom-environment-variables.json` — maps Heroku env vars to config settings

## Version Bumping

Before deploying a new release:

1. Bump the version in both packages (e.g., for a minor release):
   ```bash
   cd bookedge-server && pnpm version minor
   cd bookedge-client && pnpm version minor
   ```
   This updates `package.json` and creates a git tag automatically. Use `major`, `minor`, or `patch` as appropriate.
2. Add a new entry to `docs/release-notes.md` describing the changes
3. Push the commits and tags:
   ```bash
   git push origin main --tags
   ```

Current version: **1.6.0**

## Application Code Deployment

Both staging and production are deployed from the `main` branch.

### Deploying to Staging

```bash
git checkout main
git pull origin main
git push staging main:main
```

### Deploying to Production

```bash
git checkout main
git pull origin main
git push production main:main
```

### Monitoring Deployment

```bash
heroku logs --tail --app=fep-bookedge-staging
heroku logs --tail --app=fep-bookedge-production
```

Watch for:
- "Starting process with command `node lib/`"
- "Feathers application started on http://0.0.0.0:PORT"

## Client Bundle Deployment

When server services are added or modified, the client bundle must be regenerated:

```bash
cd bookedge-server && pnpm check
cd bookedge-server && pnpm bundle:client    # compiles + creates .tgz
cd bookedge-client && pnpm install           # picks up new .tgz
cd bookedge-client && pnpm check
```

The client is then deployed separately to Netlify.

## Database Migration Deployment

BookEdge uses Knex.js for database migrations. The `deploy-db-changes.zsh` script automates the deployment process.

### How the Script Works

The `deploy-db-changes.zsh` script:
1. Downloads the production database to your local machine
2. Applies migrations locally
3. Resets the target environment database
4. Uploads the migrated database back to the target environment

**Warning**: This causes brief downtime (2-3 minutes) while the database is reset and reloaded.

### Creating New Migrations

```bash
pnpm migrate:make migration_name
```

Edit the generated file in `migrations/` to define both `up` and `down` methods, then test locally:

```bash
pnpm migrate
```

### Deploying Migrations

```bash
# To staging
./scripts/deploy-db-changes.zsh staging

# To production (only after verifying on staging)
./scripts/deploy-db-changes.zsh production
```

## Verification

After deploying, verify the application is running:

```bash
# API health check
curl https://fep-bookedge-staging.herokuapp.com/
curl https://fep-bookedge-production.herokuapp.com/

# Verify pdftocairo is available (included natively in Heroku-24 stack)
heroku run "which pdftocairo" -a fep-bookedge-production
# Expected: /usr/bin/pdftocairo

# Check logs
heroku logs --tail --app=fep-bookedge-production
```

## Rollback Procedures

### Code Rollback

Roll back to a previous Heroku release:

```bash
heroku releases -a fep-bookedge-production
heroku rollback v### -a fep-bookedge-production
```

### Database Rollback

Roll back the latest migration locally:

```bash
pnpm migrate:down
```

To roll back a deployed migration:

```bash
./scripts/pulldb.zsh
pnpm migrate:down
heroku pg:reset --app=fep-bookedge-production --confirm fep-bookedge-production
heroku pg:push bookedge-server DATABASE_URL --app=fep-bookedge-production
```

## Troubleshooting

### Migration Errors
- Check Heroku logs for detailed error messages
- Verify the migration locally before deploying
- Roll back the migration if it can't be fixed immediately

### Database Connection Issues
- Verify the database URL in Heroku config vars: `heroku config --app=fep-bookedge-production`
- Check if the database is running and accessible

### Application Crashes After Deployment
- Roll back to the previous release
- Check logs for error messages
- Verify environment variables are correctly set

### PDF Thumbnails Not Generating
- Verify `pdftocairo` is available: `heroku run "pdftocairo -v" -a fep-bookedge-production`
- Heroku-24 stack includes `poppler-utils` natively — no buildpack needed
- Check logs for "Failed to convert PDF to image" errors

## Useful Commands

```bash
# View logs
heroku logs --tail --app=fep-bookedge-[staging|production]

# Access Heroku PostgreSQL directly
heroku pg:psql --app=fep-bookedge-[staging|production]

# Pull production database to local
./scripts/pulldb.zsh

# Check Heroku configuration
heroku config --app=fep-bookedge-[staging|production]

# Check buildpacks
heroku buildpacks --app=fep-bookedge-[staging|production]

# View release history
heroku releases --app=fep-bookedge-[staging|production]
```
