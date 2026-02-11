# Quick Deployment Checklist - PDF Thumbnails Feature

## Pre-Deployment
- [ ] All code changes committed and pushed to repository
- [ ] Quality checks passed: `cd bookedge-server && pnpm check`
- [ ] Tests passed: `pnpm test`
- [ ] Migration file created and tested locally
- [ ] Client updated and deployed (if needed)

## Staging Deployment

### 1. Add Poppler Buildpack (One-time)
```bash
heroku buildpacks:add --index 1 https://github.com/weibeld/heroku-buildpack-poppler.git -a fep-bookedge-staging
heroku buildpacks -a fep-bookedge-staging  # Verify order
```
- [ ] Poppler buildpack added
- [ ] Buildpack order verified (poppler first, nodejs second)

### 2. Deploy Database Migration
```bash
cd /Users/johnhile/dev/bookedge/bookedge-server
./scripts/deploy-db-changes.zsh staging
```
- [ ] Migration deployed successfully
- [ ] Database has `thumbnail_data` column

### 3. Deploy Application Code
```bash
git checkout staging
git pull origin staging
git push staging staging:main
```
- [ ] Code deployed
- [ ] Build successful (check logs)
- [ ] Application started successfully

### 4. Verify Staging
```bash
# Verify poppler installed
heroku run "which pdftocairo" -a fep-bookedge-staging

# Verify API running
curl https://fep-bookedge-staging.herokuapp.com/
```
- [ ] Poppler installed and accessible
- [ ] API responding
- [ ] Test PDF upload works and shows thumbnail
- [ ] No errors in logs

## Production Deployment

**⚠️ IMPORTANT**: Only proceed if staging is working perfectly!

### 1. Add Poppler Buildpack (One-time)
```bash
heroku buildpacks:add --index 1 https://github.com/weibeld/heroku-buildpack-poppler.git -a fep-bookedge-production
heroku buildpacks -a fep-bookedge-production  # Verify order
```
- [ ] Poppler buildpack added
- [ ] Buildpack order verified

### 2. Deploy Database Migration
```bash
./scripts/deploy-db-changes.zsh production
```
**⚠️ This causes brief downtime**
- [ ] Migration deployed successfully
- [ ] Database verified

### 3. Deploy Application Code
```bash
git checkout main
git pull origin main
git push production main:main
```
- [ ] Code deployed
- [ ] Build successful
- [ ] Application started

### 4. Verify Production
```bash
heroku run "which pdftocairo" -a fep-bookedge-production
curl https://fep-bookedge-production.herokuapp.com/
```
- [ ] Poppler installed
- [ ] API responding
- [ ] Test PDF upload works
- [ ] Monitor logs for 1 hour

## Post-Deployment
- [ ] Update release notes in `docs/release-notes.md`
- [ ] Tag release: `git tag -a v1.5.0 -m "Version 1.5.0"`
- [ ] Push tag: `git push origin --tags`
- [ ] Notify team of deployment
- [ ] Document any issues encountered

## Rollback (if needed)

### Remove Poppler (if causing issues)
```bash
heroku buildpacks:remove https://github.com/weibeld/heroku-buildpack-poppler.git -a fep-bookedge-[staging|production]
git push [staging|production] [branch]:main
```

### Roll back application code
```bash
heroku releases -a fep-bookedge-[staging|production]
heroku rollback v### -a fep-bookedge-[staging|production]
```

### Roll back database migration
```bash
heroku pg:psql -a fep-bookedge-[staging|production]
ALTER TABLE book_images DROP COLUMN IF EXISTS thumbnail_data;
```

## Notes
- Estimated deployment time: 15-20 minutes per environment
- Expected downtime: 2-3 minutes during database migration
- Monitor logs closely for first hour after production deployment
- Keep this checklist for future reference
