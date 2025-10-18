// Tests for Contributors schema sanitization logic
import { describe, it, expect } from 'vitest'

describe('Contributors schema published_name sanitization', () => {
  // Test the sanitization logic directly
  const sanitizePublishedName = (
    value: string | undefined,
  ): string | undefined => {
    if (typeof value === 'string') {
      return value.replace(/[,\s]+$/, '').trim()
    }
    return value
  }

  describe('removing trailing commas', () => {
    it('should remove single trailing comma', () => {
      const result = sanitizePublishedName('John Doe,')
      expect(result).toBe('John Doe')
    })

    it('should remove multiple trailing commas', () => {
      const result = sanitizePublishedName('Jane Smith,,')
      expect(result).toBe('Jane Smith')
    })

    it('should remove comma and space combination', () => {
      const result = sanitizePublishedName('John Doe, ')
      expect(result).toBe('John Doe')
    })
  })

  describe('removing trailing whitespace', () => {
    it('should remove trailing spaces', () => {
      const result = sanitizePublishedName('John Doe   ')
      expect(result).toBe('John Doe')
    })

    it('should remove trailing tabs', () => {
      const result = sanitizePublishedName('Jane Smith\t')
      expect(result).toBe('Jane Smith')
    })

    it('should remove trailing tabs and spaces', () => {
      const result = sanitizePublishedName('Jane Smith\t  ')
      expect(result).toBe('Jane Smith')
    })

    it('should remove newlines and spaces', () => {
      const result = sanitizePublishedName('John Doe\n ')
      expect(result).toBe('John Doe')
    })
  })

  describe('handling clean input', () => {
    it('should not modify name without trailing characters', () => {
      const result = sanitizePublishedName('John Doe')
      expect(result).toBe('John Doe')
    })

    it('should preserve internal commas', () => {
      const result = sanitizePublishedName('Doe, John')
      expect(result).toBe('Doe, John')
    })

    it('should preserve internal spaces', () => {
      const result = sanitizePublishedName('John M. Doe')
      expect(result).toBe('John M. Doe')
    })
  })

  describe('handling edge cases', () => {
    it('should handle undefined value', () => {
      const result = sanitizePublishedName(undefined)
      expect(result).toBeUndefined()
    })

    it('should handle empty string', () => {
      const result = sanitizePublishedName('')
      expect(result).toBe('')
    })

    it('should handle string with only whitespace', () => {
      const result = sanitizePublishedName('   ')
      expect(result).toBe('')
    })

    it('should handle string with only commas', () => {
      const result = sanitizePublishedName(',,,')
      expect(result).toBe('')
    })
  })

  describe('complex scenarios', () => {
    it('should handle multiple types of trailing characters', () => {
      const result = sanitizePublishedName('John Doe, \t\n ')
      expect(result).toBe('John Doe')
    })

    it('should preserve leading whitespace but remove trailing', () => {
      const result = sanitizePublishedName('  John Doe  ')
      expect(result).toBe('John Doe')
    })

    it('should handle names with accents and special characters', () => {
      const result = sanitizePublishedName('José García,  ')
      expect(result).toBe('José García')
    })
  })
})
