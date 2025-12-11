/**
 * Internal service path and methods for service-to-service communication
 */
export const internalPath = 'internal'

export const internalMethods = ['find', 'get'] as const

export type InternalClientService = {
  find(params?: unknown): Promise<unknown>
  get(id: string, params?: unknown): Promise<unknown>
}

// Add this service to the service types
// Note: Internal service is NOT added to the client because it requires service auth, not user JWT auth
declare module '../../client' {
  interface ServiceTypes {
    [internalPath]: InternalClientService
  }
}
