import { resolve } from '@feathersjs/schema'
import { formatISO } from 'date-fns'
import type { HookContext } from '../declarations'
import type { PropertyResolverMap } from '@feathersjs/schema'

// Define an interface that includes the update fields
interface WithUpdatedFields {
  updated_at?: string
  fk_updated_by?: number
}

// Define an interface that includes the create fields
interface WithCreatedFields extends WithUpdatedFields {
  created_at?: string
  fk_created_by?: number
}

/**
 * Creates a standard resolver for updating fields during patch and update operations
 * @returns A resolver that sets updated_at and fk_updated_by fields
 */
export function createUpdateResolver<T extends WithUpdatedFields>() {
  // Just return the property resolver map directly
  return {
    updated_at: async () => formatISO(new Date()),
    fk_updated_by: async (value: any, data: any, context: HookContext<any>) =>
      context.params.user?.id,
  } as unknown as PropertyResolverMap<T, HookContext<any>>
}

/**
 * Creates a standard resolver for create operations that sets both
 * created_by/created_at and updated_by/updated_at fields
 * @returns A resolver that sets all created and updated fields
 */
export function createDataResolver<T extends WithCreatedFields>() {
  // Just return the property resolver map directly
  return {
    created_at: async () => formatISO(new Date()),
    fk_created_by: async (value: any, data: any, context: HookContext<any>) =>
      context.params.user?.id,
    updated_at: async () => formatISO(new Date()),
    fk_updated_by: async (value: any, data: any, context: HookContext<any>) =>
      context.params.user?.id,
  } as unknown as PropertyResolverMap<T, HookContext<any>>
}
