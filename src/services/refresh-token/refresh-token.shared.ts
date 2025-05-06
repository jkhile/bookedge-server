// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  RefreshToken,
  RefreshTokenData,
  RefreshTokenPatch,
  RefreshTokenQuery,
  RefreshTokenService,
} from './refresh-token.class'

export type {
  RefreshToken,
  RefreshTokenData,
  RefreshTokenPatch,
  RefreshTokenQuery,
}

export type RefreshTokenClientService = Pick<
  RefreshTokenService<Params<RefreshTokenQuery>>,
  (typeof refreshTokenMethods)[number]
>

export const refreshTokenPath = 'refresh-token'

export const refreshTokenMethods: Array<keyof RefreshTokenService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
]

export const refreshTokenClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(refreshTokenPath, connection.service(refreshTokenPath), {
    methods: refreshTokenMethods,
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [refreshTokenPath]: RefreshTokenClientService
  }
}
