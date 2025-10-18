// Tests for authentication strategies configuration
import { describe, it, expect } from 'vitest'
import { app } from '../src/app'

describe('authentication strategies', () => {
  describe('strategy registration', () => {
    it('should have authentication service registered', () => {
      const authService = app.service('authentication')
      expect(authService).toBeDefined()
      expect(typeof authService.create).toBe('function')
    })

    it('should have JWT strategy available', () => {
      const authService = app.service('authentication')
      expect(authService).toBeDefined()

      // Verify the authentication service has strategy configuration
      const config = authService.configuration
      expect(config).toBeDefined()
      expect(config.authStrategies).toContain('jwt')
    })

    it('should have local strategy available', () => {
      const authService = app.service('authentication')
      expect(authService).toBeDefined()

      const config = authService.configuration
      expect(config).toBeDefined()
      expect(config.authStrategies).toContain('local')
    })

    it('should have configured authentication strategies', () => {
      const authService = app.service('authentication')
      expect(authService).toBeDefined()

      const config = authService.configuration
      expect(config).toBeDefined()
      expect(config.authStrategies).toBeDefined()
      expect(Array.isArray(config.authStrategies)).toBe(true)
      expect(config.authStrategies.length).toBeGreaterThan(0)
    })

    it('should have entity configured as user', () => {
      const authService = app.service('authentication')
      const config = authService.configuration

      expect(config).toBeDefined()
      expect(config.entity).toBe('user')
    })

    it('should have service configured as users', () => {
      const authService = app.service('authentication')
      const config = authService.configuration

      expect(config).toBeDefined()
      expect(config.service).toBe('users')
    })
  })

  describe('authentication service hooks', () => {
    it('should have hooks configured', () => {
      const authService = app.service('authentication')
      expect(authService.__hooks).toBeDefined()
    })

    it('should have after create hooks for refresh token', () => {
      const authService = app.service('authentication')

      // Check that hooks are registered
      expect(authService.__hooks).toBeDefined()
      expect(authService.__hooks.after).toBeDefined()
      expect(authService.__hooks.after.create).toBeDefined()
      expect(Array.isArray(authService.__hooks.after.create)).toBe(true)
      expect(authService.__hooks.after.create.length).toBeGreaterThan(0)
    })
  })

  describe('authentication configuration', () => {
    it('should have secret configured', () => {
      const authService = app.service('authentication')
      const config = authService.configuration

      expect(config.secret).toBeDefined()
      expect(typeof config.secret).toBe('string')
      expect(config.secret.length).toBeGreaterThan(0)
    })

    it('should have jwtOptions configured', () => {
      const authService = app.service('authentication')
      const config = authService.configuration

      expect(config.jwtOptions).toBeDefined()
      expect(config.jwtOptions.expiresIn).toBeDefined()
    })
  })
})
