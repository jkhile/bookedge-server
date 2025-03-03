# Testing in BookEdge Server

This project uses Vitest for unit testing.

## Running Tests

- Run all tests: `pnpm test`
- Run tests in watch mode: `pnpm test:watch`
- Run tests with coverage: `pnpm test:coverage`
- Run tests with UI: `pnpm test:ui`

## Test Structure

Tests are organized in a similar structure to the src directory:

- `test/app.test.ts` - Tests for the main app
- `test/client.test.ts` - Tests for the client
- `test/services/` - Tests for individual services

## Writing Tests

When writing a new test, follow these patterns:

```typescript
import { describe, it, expect } from 'vitest'

describe('My feature', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test'
    
    // Act
    const result = doSomething(input)
    
    // Assert
    expect(result).toBe('expected output')
  })
})
```

For service tests, use the standard template:

```typescript
import { app } from '../../src/app'

describe('my-service', () => {
  it('registered the service', () => {
    const service = app.service('my-service')
    expect(service).toBeTruthy()
  })
})
```

## Test Isolation

Each test file operates in isolation. If you need to work with the full server, remember to:

1. Use a unique port for each test file 
2. Clean up servers properly in afterAll hooks
3. Set app configuration appropriately for the test environment

## Mocking

Vitest provides powerful mocking capabilities. Use `vi.mock()` for module mocking and `vi.fn()` for function mocking.

```typescript
// Mocking a module
vi.mock('../../src/some-module', () => ({
  someFunction: vi.fn().mockReturnValue('mocked result')
}))

// Mocking a function
const mockFn = vi.fn().mockReturnValue('result')
```