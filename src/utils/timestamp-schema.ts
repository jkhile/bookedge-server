import { Type } from '@feathersjs/typebox'

// Standardized timestamp schema definition
// This ensures all services use the same timestamp format
export const timestampSchema = () => Type.String({ format: 'date-time' })

// For use in schema definitions
export const timestampFields = {
  created_at: Type.Optional(timestampSchema()),
  updated_at: Type.Optional(timestampSchema()),
}

// For resolver that ensures timestamps are always ISO strings
export const timestampResolver = async (value: any) => {
  if (!value) return null

  // If it's already a valid ISO string, return as-is
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return value
  }

  // If it's a Date object or timestamp, convert to ISO string
  try {
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date.toISOString()
    }
  } catch {
    // Fall through to return null
  }

  return null
}
