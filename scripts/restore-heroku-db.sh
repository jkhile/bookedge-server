#!/bin/bash

# BookEdge Heroku Database Restore Script
# This script restores a backup to the Heroku PostgreSQL database

# Configuration
HEROKU_APP_NAME="${HEROKU_APP_NAME:-bookedge}"  # Replace with your actual Heroku app name if different
BACKUP_DIR="${BACKUP_DIR:-./backups}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to show usage
show_usage() {
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 backups/bookedge_20231201_143022.sql"
    echo "         $0 backups/bookedge_20231201_143022.sql.gz"
    echo ""
    echo "Available backups:"
    if [ -d "$BACKUP_DIR" ]; then
        ls -lt "$BACKUP_DIR"/*.sql* 2>/dev/null | head -5
    else
        echo "No backup directory found at $BACKUP_DIR"
    fi
}

# Check if backup file is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    show_usage
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file '$BACKUP_FILE' not found${NC}"
    show_usage
    exit 1
fi

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo -e "${RED}Error: Heroku CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if user is logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo -e "${RED}Error: Not logged in to Heroku. Please run 'heroku login' first.${NC}"
    exit 1
fi

# Warning about destructive operation
echo -e "${RED}⚠️  WARNING: This will completely replace the database on Heroku app '$HEROKU_APP_NAME'${NC}"
echo -e "${RED}   All existing data will be lost!${NC}"
echo -e "${YELLOW}Backup file: $BACKUP_FILE${NC}"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo -e "${YELLOW}Operation cancelled.${NC}"
    exit 0
fi

# Get database URL from Heroku
echo -e "${YELLOW}Fetching database credentials from Heroku...${NC}"
DATABASE_URL=$(heroku config:get DATABASE_URL -a "$HEROKU_APP_NAME" 2>/dev/null)

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: Could not fetch DATABASE_URL from Heroku app '$HEROKU_APP_NAME'${NC}"
    echo "Make sure you have access to the app and the app name is correct."
    exit 1
fi

# Handle compressed files
TEMP_FILE=""
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo -e "${YELLOW}Decompressing backup file...${NC}"
    TEMP_FILE=$(mktemp)
    if ! gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"; then
        echo -e "${RED}Error: Failed to decompress backup file${NC}"
        rm -f "$TEMP_FILE"
        exit 1
    fi
    BACKUP_FILE="$TEMP_FILE"
fi

# Restore database
echo -e "${YELLOW}Restoring database from backup...${NC}"
echo -e "${YELLOW}This may take several minutes depending on the database size...${NC}"

if psql "$DATABASE_URL" -f "$BACKUP_FILE" --quiet; then
    echo -e "${GREEN}✓ Database restore completed successfully!${NC}"
else
    echo -e "${RED}✗ Database restore failed!${NC}"
    # Clean up temp file if it exists
    if [ -n "$TEMP_FILE" ]; then
        rm -f "$TEMP_FILE"
    fi
    exit 1
fi

# Clean up temp file if it exists
if [ -n "$TEMP_FILE" ]; then
    rm -f "$TEMP_FILE"
fi

echo -e "${GREEN}✓ Restore process completed!${NC}"