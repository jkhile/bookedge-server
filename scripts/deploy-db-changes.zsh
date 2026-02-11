#!/bin/zsh

# File: deploy-db-changes.zsh
# Usage: ./deploy-db-changes.zsh [staging|production]

# Check that a single argument was provided
if [ $# -ne 1 ]; then
  echo "Usage: $0 [staging|production]"
  exit 1
fi

ENV=$1

# Optional: Validate that the argument is one of the expected values
if [ "$ENV" != "staging" ] && [ "$ENV" != "production" ]; then
  echo "Error: Argument must be either 'staging' or 'production'."
  exit 1
fi

# 1. Drop the local database
echo "Dropping local database 'bookedge-server'..."
dropdb bookedge-server

# 2. Pull the production database from Heroku to local
echo "Pulling remote database into local 'bookedge-server'..."
heroku pg:pull DATABASE_URL bookedge-server --app=fep-bookedge-production

# 3. Run migrations locally
echo "Running migrations..."
pnpm run migrate

# 4. Reset the remote database on Heroku
echo "Resetting remote database on Heroku..."
heroku pg:reset --app=fep-bookedge-${ENV} --confirm fep-bookedge-${ENV}

# 5. Push the local database up to Heroku
echo "Pushing local database back up to Heroku..."
heroku pg:push bookedge-server DATABASE_URL --app=fep-bookedge-${ENV}

echo "Deployment steps completed."
