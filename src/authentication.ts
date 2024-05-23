import { AuthenticationService, JWTStrategy } from '@feathersjs/authentication'
import { LocalStrategy } from '@feathersjs/authentication-local'
import { logger } from './logger'
import { oauth, OAuthStrategy } from '@feathersjs/authentication-oauth'
import { logAuthenticationHook } from './hooks/log-authentication'
// For more information about this file see https://dove.feathersjs.com/guides/cli/authentication.html
import type { Params } from '@feathersjs/feathers'
import type { OAuthProfile } from '@feathersjs/authentication-oauth'
import type { Application } from './declarations'
import {
  AuthenticationRequest,
  AuthenticationParams,
} from '@feathersjs/authentication'

declare module './declarations' {
  interface ServiceTypes {
    authentication: AuthenticationService
  }
}

export const authentication = (app: Application) => {
  const authentication = new AuthenticationService(app)

  authentication.register('jwt', new JWTStrategy())
  authentication.register('local', new LocalStrategy())
  authentication.register('google', new GoogleStrategy())

  app.use('authentication', authentication)
  app.configure(oauth())
  app.service('authentication').hooks({
    around: {
      create: [logAuthenticationHook()],
    },
  })
}

class GoogleStrategy extends OAuthStrategy {
  async getEntityData(profile: OAuthProfile, existing: any, params: Params) {
    const baseData = await super.getEntityData(profile, existing, params)

    return {
      ...baseData,
      email: profile.email,
      access_token: profile.access_token,
      refresh_token: profile.refresh_token,
    }
  }

  async findEntityByEmail(profile: OAuthProfile, params: Params) {
    const query = {
      email: profile.email,
    }

    const result = await this.entityService.find({
      ...params,
      query,
    })
    const [entity] = result.data ?? result

    logger.debug('findEntityByEmail returning', entity)

    return entity
  }

  async authenticate(
    authentication: AuthenticationRequest,
    originalParams: AuthenticationParams,
  ) {
    const entity: string = this.configuration.entity
    const { ...params } = originalParams
    const profile = await this.getProfile(authentication, params)
    profile.access_token = authentication.access_token
    profile.refresh_token = authentication.refresh_token
    // if no user with a matching google id is found, query for a user with a matching email
    // to see if an admin has 'invited' a user by creating an initial user record.
    const existingEntity =
      (await this.findEntity(profile, params)) ||
      (await this.findEntityByEmail(profile, params)) ||
      (await this.getCurrentEntity(params))
    if (!existingEntity) {
      logger.debug('No existing entity found, throwing error')
      throw new Error('User not recognized')
    }
    const authEntity = existingEntity
      ? await this.updateEntity(existingEntity, profile, params)
      : await this.createEntity(profile, params)

    return {
      authentication: { strategy: this.name as string },
      [entity]: await this.getEntity(authEntity, originalParams),
    }
  }
}
