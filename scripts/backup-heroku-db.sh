#!/bin/bash

# BookEdge Heroku Database Backup Script
# This script creates a backup of the Heroku PostgreSQL database

# Configuration
HEROKU_APP_NAME="${HEROKU_APP_NAME:-bookedge}"  # Replace with your actual Heroku app name if different
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="bookedge_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Starting BookEdge database backup...${NC}"

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

# Get database URL from Heroku
echo -e "${YELLOW}Fetching database credentials from Heroku...${NC}"
DATABASE_URL=$(heroku config:get DATABASE_URL -a "$HEROKU_APP_NAME" 2>/dev/null)

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: Could not fetch DATABASE_URL from Heroku app '$HEROKU_APP_NAME'${NC}"
    echo "Make sure you have access to the app and the app name is correct."
    exit 1
fi

# Create backup using pg_dump
echo -e "${YELLOW}Creating backup to: ${BACKUP_PATH}${NC}"

if pg_dump "$DATABASE_URL" --verbose --no-owner --no-acl -f "$BACKUP_PATH"; then
    # Get file size
    FILE_SIZE=$(ls -lh "$BACKUP_PATH" | awk '{print $5}')
    echo -e "${GREEN}✓ Backup completed successfully!${NC}"
    echo -e "${GREEN}  File: ${BACKUP_PATH}${NC}"
    echo -e "${GREEN}  Size: ${FILE_SIZE}${NC}"
    
    # Create a compressed version
    echo -e "${YELLOW}Creating compressed backup...${NC}"
    gzip -k "$BACKUP_PATH"
    COMPRESSED_SIZE=$(ls -lh "${BACKUP_PATH}.gz" | awk '{print $5}')
    echo -e "${GREEN}✓ Compressed backup created: ${BACKUP_PATH}.gz (${COMPRESSED_SIZE})${NC}"
    
    # Keep only the last 10 backups (optional cleanup)
    echo -e "${YELLOW}Cleaning up old backups...${NC}"
    cd "$BACKUP_DIR"
    ls -t *.sql 2>/dev/null | tail -n +11 | xargs -r rm -f
    ls -t *.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
    cd - > /dev/null
    
    echo -e "${GREEN}✓ Backup process completed!${NC}"
else
    echo -e "${RED}✗ Backup failed!${NC}"
    exit 1
fi

# Optional: Show recent backups
echo -e "\n${YELLOW}Recent backups:${NC}"
ls -lht "$BACKUP_DIR" | head -6