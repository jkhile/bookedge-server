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

## Quality Control
- Always run `pnpm check` after modifying code files
- Fix all type errors, lint errors and warnings before committing changes
- Use proper TypeScript typing for hook contexts and service parameters
- Services should properly define their schemas and validators
- Always add appropriate error handling