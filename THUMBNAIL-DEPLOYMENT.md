# Deploying PDF Thumbnail Generation Feature to Heroku

## Overview

This guide provides step-by-step instructions for deploying the PDF thumbnail generation feature to BookEdge server's staging and production environments on Heroku.

## What Changed

The thumbnail generation feature now:
- Generates base64-encoded thumbnails for uploaded images and PDFs
- Stores thumbnails in the `book_images.thumbnail_data` database column
- Uses `pdftocairo` (from poppler-utils) to convert PDF pages to images
- Uses `sharp` library to resize and optimize thumbnails

## Key Dependencies

### System Dependencies (NEW - Critical)
- **poppler-utils**: Required for PDF thumbnail generation via `pdftocairo` command
  - Without this, PDF uploads will fall back to placeholder thumbnails
  - Must be installed via Heroku buildpack

### NPM Dependencies (Already in package.json)
- `sharp@^0.34.4`: Image processing and thumbnail generation
- No longer depends on `pdf-poppler` or `pdf-lib`

## Pre-Deployment Checklist

### 1. Code Changes Completed ✓
- [x] Updated `thumbnail-generator.ts` to use `pdftocairo` directly
- [x] Removed `pdf-poppler` and `pdf-lib` dependencies
- [x] Updated `book-images.schema.ts` to include `thumbnail_data` field
- [x] Quality checks passed on server
- [x] Client updated to display base64 thumbnails

### 2. Database Migration Required
- **Migration file**: `migrations/[timestamp]_add_thumbnail_data_to_book_images.js`
- **Changes**: Adds `thumbnail_data` TEXT column to `book_images` table
- **Status**: Already created and tested locally

### 3. Test Current State
Before deploying, verify locally:
```bash
cd /Users/johnhile/dev/bookedge/bookedge-server
pnpm check
pnpm test
```

## Deployment Steps

### Step 1: Add Poppler Buildpack to Heroku

The poppler buildpack must be added **before** the Node.js buildpack so that `pdftocairo` is available when the application starts.

#### For Staging:
```bash
# Add poppler buildpack (must be FIRST)
heroku buildpacks:add --index 1 https://github.com/weibeld/heroku-buildpack-poppler.git -a fep-bookedge-staging

# Verify buildpack order (poppler should be index 1, nodejs should be index 2)
heroku buildpacks -a fep-bookedge-staging
```

Expected output:
```
=== fep-bookedge-staging Buildpack URLs
1. https://github.com/weibeld/heroku-buildpack-poppler.git
2. heroku/nodejs
```

#### For Production:
```bash
# Add poppler buildpack (must be FIRST)
heroku buildpacks:add --index 1 https://github.com/weibeld/heroku-buildpack-poppler.git -a fep-bookedge-production

# Verify buildpack order
heroku buildpacks -a fep-bookedge-production
```

### Step 2: Deploy Database Migration

The migration adds the `thumbnail_data` column to the `book_images` table.

#### For Staging:
```bash
cd /Users/johnhile/dev/bookedge/bookedge-server

# Deploy database changes to staging
./deploy-db-changes.zsh staging
```

This will:
1. Pull production database locally
2. Apply the migration locally
3. Reset staging database
4. Upload the migrated database to staging

#### For Production:
```bash
# Deploy database changes to production
./deploy-db-changes.zsh production
```

**⚠️ WARNING**: This will cause brief downtime while the database is reset. Plan accordingly.

### Step 3: Deploy Application Code

#### For Staging:
```bash
cd /Users/johnhile/dev/bookedge/bookedge-server

# Ensure you're on the correct branch
git checkout staging
git pull origin staging

# Deploy to staging
git push staging staging:main

# Monitor deployment
heroku logs --tail -a fep-bookedge-staging
```

Watch for:
- ✅ Build successful
- ✅ "Starting process with command `node lib/`"
- ✅ "Feathers application started on http://0.0.0.0:PORT"
- ❌ Any errors mentioning "pdftocairo" or "poppler"

#### For Production:
```bash
# Ensure you're on the main branch
git checkout main
git pull origin main

# Deploy to production
git push production main:main

# Monitor deployment
heroku logs --tail -a fep-bookedge-production
```

### Step 4: Verify Deployment

#### Verify Poppler Installation:
```bash
# For staging
heroku run "which pdftocairo" -a fep-bookedge-staging
# Expected: /app/vendor/poppler/bin/pdftocairo

# For production
heroku run "which pdftocairo" -a fep-bookedge-production
```

#### Verify API is Running:
```bash
# For staging
curl https://fep-bookedge-staging.herokuapp.com/

# For production
curl https://fep-bookedge-production.herokuapp.com/
```

#### Test Thumbnail Generation:
1. Log into the BookEdge client (staging or production)
2. Navigate to a book's Marketing view
3. Upload a new PDF file (or re-upload an existing one)
4. Verify:
   - The thumbnail shows the actual PDF content (not a placeholder)
   - The image is not stretched or cropped in the gallery views

### Step 5: Monitor for Issues

After deployment, monitor the logs for the first hour:

```bash
# For staging
heroku logs --tail -a fep-bookedge-staging

# For production
heroku logs --tail -a fep-bookedge-production
```

Watch for:
- ❌ "Failed to convert PDF to image" errors (indicates poppler issues)
- ❌ "ENOENT: no such file or directory" for pdftocairo
- ✅ "PDF converted to PNG successfully" (normal)
- ✅ "Thumbnail generated successfully" (normal)

## Rollback Procedures

### If Poppler Buildpack Causes Issues:

```bash
# Remove poppler buildpack
heroku buildpacks:remove https://github.com/weibeld/heroku-buildpack-poppler.git -a fep-bookedge-[staging|production]

# Redeploy without poppler (will use placeholder thumbnails for PDFs)
git push [staging|production] [branch]:main
```

### If Database Migration Causes Issues:

```bash
# Connect to the database
heroku pg:psql -a fep-bookedge-[staging|production]

# Check if column exists
\d book_images

# If needed, manually roll back
ALTER TABLE book_images DROP COLUMN IF EXISTS thumbnail_data;
```

### If Application Code Causes Issues:

```bash
# Roll back to previous release
heroku releases -a fep-bookedge-[staging|production]
heroku rollback v### -a fep-bookedge-[staging|production]
```

## Post-Deployment Tasks

### 1. Update Existing Image Records (Optional)

Existing images in the database won't have thumbnails until they're re-uploaded. You can:

**Option A**: Leave as-is (placeholders will show for old images)
**Option B**: Re-upload important images to generate thumbnails

### 2. Update Release Notes

Add entry to `release-notes.md`:
```markdown
## Version 1.5.0 - [Date]

### Features
- PDF thumbnail generation: Thumbnails are now generated and stored for uploaded PDFs and images
- Improved gallery display: Thumbnails display correctly without stretching or cropping

### Technical Changes
- Added poppler buildpack for PDF rendering
- Added `thumbnail_data` column to `book_images` table
- Replaced pdf-poppler with direct pdftocairo calls
- Updated image gallery components to use contain instead of cover
```

### 3. Update Documentation

If needed, update user-facing documentation to reflect that:
- PDF thumbnails now show actual PDF content
- Larger PDFs may take slightly longer to upload due to thumbnail generation

## Troubleshooting

### Issue: "pdftocairo: command not found"

**Cause**: Poppler buildpack not installed or not in correct order

**Solution**:
```bash
# Check buildpack order
heroku buildpacks -a fep-bookedge-[staging|production]

# If poppler is not first, remove and re-add
heroku buildpacks:clear -a fep-bookedge-[staging|production]
heroku buildpacks:add https://github.com/weibeld/heroku-buildpack-poppler.git -a fep-bookedge-[staging|production]
heroku buildpacks:add heroku/nodejs -a fep-bookedge-[staging|production]

# Redeploy
git push [staging|production] [branch]:main
```

### Issue: PDF Thumbnails Show Placeholder

**Cause**: Either poppler not installed or PDF conversion is failing silently

**Solution**:
1. Check logs for PDF conversion errors
2. Verify poppler is installed: `heroku run "pdftocairo -v" -a fep-bookedge-[staging|production]`
3. Test with a different PDF file

### Issue: Thumbnails Too Large/Slow

**Cause**: Thumbnail quality or scale settings too high

**Solution**: The current settings (1024px max, 80% JPEG quality) should be fine, but can be adjusted in `thumbnail-generator.ts` if needed.

## Additional Notes

### Why This Approach?

- **Direct pdftocairo calls**: More reliable than npm packages with bundled binaries
- **System poppler**: Always uses the latest version, better compatibility
- **Base64 storage**: No need for separate file storage or CDN for thumbnails
- **Fallback gracefully**: If PDF conversion fails, shows placeholder instead of crashing

### Alternative Approaches Considered

1. **Using pdf-poppler npm package**: Rejected because it bundles old poppler version (0.66 from 2018)
2. **Using pdf-lib**: Rejected because it can't render PDFs to images
3. **External service (e.g., Cloudinary)**: Rejected to keep costs down and maintain control

### Heroku-Specific Considerations

- **Ephemeral filesystem**: Temporary files are cleaned up automatically
- **Memory limits**: Sharp and pdftocairo are efficient, but monitor memory usage
- **Build time**: Poppler buildpack adds ~30 seconds to build time
- **Dyno size**: Standard/Performance dynos recommended for production

## References

- [Heroku Buildpacks Documentation](https://devcenter.heroku.com/articles/buildpacks)
- [Heroku Poppler Buildpack](https://github.com/weibeld/heroku-buildpack-poppler)
- [Sharp Documentation](https://sharp.pixelplumbingcod.uk/)
- [Poppler Utils Documentation](https://poppler.freedesktop.org/)

## Contact

If you encounter issues during deployment, contact:
- John Hile: john.hile@frontedgepublishing.com
