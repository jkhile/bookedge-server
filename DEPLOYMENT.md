# BookEdge Server Deployment Guide

This document provides detailed instructions for deploying the BookEdge server application to both staging and production environments.

## Overview

BookEdge server is a Feathers.js application deployed on Heroku with a PostgreSQL database. The deployment process consists of two main components:

1. **Code deployment**: Deploying the application code to Heroku
2. **Database deployment**: Deploying database schema changes using migrations

## Prerequisites

Before you can deploy the application, you'll need:

- Heroku CLI installed and authenticated
- Git installed
- Node.js and pnpm installed
- PostgreSQL installed locally
- Access to the BookEdge Heroku applications (fep-bookedge-staging and fep-bookedge-production)

## Environment Configuration

BookEdge server uses different environment configurations:

- **Development**: Used for local development
- **Staging**: Used for testing in a production-like environment
- **Production**: The live environment used by end users

Configuration for these environments are managed in the `config` directory:
- `default.json`: Base configuration
- `production.json`: Production-specific overrides
- `custom-environment-variables.json`: Maps environment variables to configuration settings

## Application Deployment

### Deploying to Staging

1. Ensure all code changes are committed to the staging branch:
   ```bash
   git checkout staging
   git pull origin staging
   ```

2. Deploy to Heroku staging:
   ```bash
   git push heroku-staging staging:main
   ```

3. Monitor the deployment:
   ```bash
   heroku logs --tail --app=fep-bookedge-staging
   ```

4. Verify the deployment by accessing the staging API:
   ```bash
   curl https://fep-bookedge-staging.herokuapp.com/
   ```

### Deploying to Production

1. Ensure all code changes are tested on staging and committed to the main branch:
   ```bash
   git checkout main
   git pull origin main
   ```

2. Deploy to Heroku production:
   ```bash
   git push heroku-production main:main
   ```

3. Monitor the deployment:
   ```bash
   heroku logs --tail --app=fep-bookedge-production
   ```

4. Verify the deployment by accessing the production API:
   ```bash
   curl https://fep-bookedge-production.herokuapp.com/
   ```

## Database Migration Deployment

BookEdge uses Knex.js for database migrations. The `deploy-db-changes.zsh` script automates the process of applying migrations to staging or production environments.

### How the Script Works

The `deploy-db-changes.zsh` script:
1. Downloads the production database to your local machine
2. Applies migrations locally
3. Resets the target environment database (staging or production)
4. Uploads the migrated database back to the target environment

### Deploying Database Changes to Staging

```bash
./deploy-db-changes.zsh staging
```

### Deploying Database Changes to Production

```bash
./deploy-db-changes.zsh production
```

**IMPORTANT**: This process will cause a brief downtime while the database is being reset and reloaded. Plan accordingly.

## Creating New Migrations

When you need to make database schema changes:

1. Create a new migration file:
   ```bash
   pnpm migrate:make migration_name
   ```

2. Edit the generated migration file in the `migrations` directory to define your changes:
   - Define both `up` and `down` methods to allow rollbacks
   - Use Knex.js schema builder methods to define changes

3. Test the migration locally:
   ```bash
   pnpm migrate
   ```

4. Deploy the migration to staging and then production using the steps above

## Rolling Back Migrations

If a migration needs to be rolled back:

1. Run the rollback locally:
   ```bash
   pnpm migrate:down
   ```

2. Test that the rollback worked correctly

3. If needed, you can pull the database from production, roll back locally, and then push to the target environment:
   ```bash
   ./pulldb.zsh
   pnpm migrate:down
   heroku pg:reset --app=fep-bookedge-[staging|production] --confirm fep-bookedge-[staging|production]
   heroku pg:push bookedge-server DATABASE_URL --app=fep-bookedge-[staging|production]
   ```

## Troubleshooting

### Common Issues

1. **Migration Errors**:
   - Check the Heroku logs for detailed error messages
   - Verify the migration locally before deploying
   - Consider rolling back the migration if it can't be fixed immediately

2. **Database Connection Issues**:
   - Verify the database URL in Heroku config vars
   - Check if the database is running and accessible

3. **Application Crashes After Deployment**:
   - Roll back to the previous version if necessary
   - Check logs for error messages
   - Verify environment variables are correctly set

### Useful Commands

- View Heroku logs:
  ```bash
  heroku logs --tail --app=fep-bookedge-[staging|production]
  ```

- Access the Heroku PostgreSQL database directly:
  ```bash
  heroku pg:psql --app=fep-bookedge-[staging|production]
  ```

- Pull the production database to local for inspection:
  ```bash
  ./pulldb.zsh
  ```

- Check Heroku configuration:
  ```bash
  heroku config --app=fep-bookedge-[staging|production]
  ```

## Release Process Checklist

Follow this checklist when releasing a new version:

1. Create a new version entry in `release-notes.md`
2. Update the version number in `package.json`
3. Test all changes locally and on staging
4. Ensure all migrations work correctly
5. Deploy code changes to production
6. Deploy database changes to production (if any)
7. Verify the application is working correctly in production
8. Tag the release in git:
   ```bash
   git tag -a v0.x.0 -m "Version 0.x.0"
   git push origin --tags
   ```

## Client-Side Deployment

Note that the BookEdge client application is deployed separately to Netlify. See the client deployment guide for details on that process.

## Additional Resources

- [Feathers.js Documentation](https://docs.feathersjs.com/)
- [Knex.js Documentation](https://knexjs.org/)
- [Heroku Dev Center](https://devcenter.heroku.com/)