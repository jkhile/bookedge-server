# BookEdge Server Development Guide

## Development Commands
- Development server: `pnpm dev`
- Test environment: `pnpm dev:test`
- Lint check: `pnpm lint`
- Code formatting: `pnpm prettier`
- Type checking & build: `pnpm compile`
- Full check: `pnpm check` (runs prettier + lint + compile)

## Database Commands
- Run migrations: `pnpm migrate`
- Revert migration: `pnpm migrate:down`
- Create migration: `pnpm migrate:make <name>`
- Reset test database: `pnpm reset-db`

## Test Commands
- Run tests: `pnpm test`
- Watch mode: `pnpm test:watch`
- Coverage report: `pnpm test:coverage`
- Test UI: `pnpm test:ui`
- Run single test: Use Vitest's `.only()` pattern - `describe.only()` or `it.only()`

## Code Style
- TypeScript with strict typing
- FeathersJS framework patterns
- Single quotes, no semicolons, 2-space indent
- No explicit `any` types
- Use hooks for cross-cutting concerns
- Structured error handling with typed returns
- Descriptive variable names in camelCase

## Date and Timestamp Types

BookEdge uses a deliberate approach to date and timestamp handling:

**System Timestamps (created_at, updated_at):**
- Database: `timestamp with time zone` 
- Schema: `Type.String({ format: 'date-time' })`
- Resolvers: Use `formatISO(new Date())` or `new Date().toISOString()`
- Purpose: Precise record keeping with timezone info

**User-Facing Dates (publication_date, submission_date, etc.):**
- Database: `text` or `varchar` 
- Schema: `Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' })`
- Format: Always YYYY-MM-DD string format
- Purpose: Human-readable, no timezone confusion, simple validation

**Rationale:**
- User-facing dates are date-only (no time component needed)
- String dates are easier to work with in forms, validation, and display
- Avoids timezone complexity for business dates
- Consistent with existing UI patterns and validation

## Quality Control
- Always run `pnpm check` after modifying code files
- Fix all type errors, lint errors and warnings before committing changes
- Use proper TypeScript typing for hook contexts and service parameters
- Services should properly define their schemas and validators
- Always add appropriate error handling