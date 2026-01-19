import { describe, it, expect } from 'vitest'
import {
  PLATFORM_MAPPINGS,
  getAccountPathForPlatform,
  getPlatformForAccountPath,
  getDisplayNameForPlatform,
  getPlatformConfig,
  getAllPlatformCodes,
} from '../../src/utils/platform-mappings'

describe('platform-mappings', () => {
  describe('PLATFORM_MAPPINGS constant', () => {
    it('should contain all expected platforms', () => {
      const expectedPlatforms = [
        'lsi',
        'kindle',
        'nook',
        'apple',
        'google',
        'kobo',
        'audible',
        'kindle-unlimited',
        'kobo-plus',
        'aerio',
        'third-party',
      ]

      const actualPlatforms = PLATFORM_MAPPINGS.map((p) => p.code)
      expect(actualPlatforms).toEqual(expectedPlatforms)
    })

    it('should have valid structure for each platform', () => {
      for (const platform of PLATFORM_MAPPINGS) {
        expect(platform).toHaveProperty('code')
        expect(platform).toHaveProperty('displayName')
        expect(platform).toHaveProperty('accountPath')
        expect(typeof platform.code).toBe('string')
        expect(typeof platform.displayName).toBe('string')
        expect(typeof platform.accountPath).toBe('string')
        expect(platform.code.length).toBeGreaterThan(0)
        expect(platform.displayName.length).toBeGreaterThan(0)
        expect(platform.accountPath.length).toBeGreaterThan(0)
      }
    })
  })

  describe('getAccountPathForPlatform', () => {
    it('should return correct account path for lsi', () => {
      expect(getAccountPathForPlatform('lsi')).toBe(
        'Commissions Income:Retail Commissions:Lighting Source',
      )
    })

    it('should return correct account path for kindle', () => {
      expect(getAccountPathForPlatform('kindle')).toBe(
        'Commissions Income:Retail Commissions:Kindle',
      )
    })

    it('should return correct account path for audible', () => {
      expect(getAccountPathForPlatform('audible')).toBe(
        'Commissions Income:Audible',
      )
    })

    it('should return correct account path for third-party', () => {
      expect(getAccountPathForPlatform('third-party')).toBe(
        'Sales of Product Income:Book Sales Third Party',
      )
    })

    it('should return undefined for unknown platform', () => {
      expect(getAccountPathForPlatform('unknown')).toBeUndefined()
    })

    it('should return undefined for empty string', () => {
      expect(getAccountPathForPlatform('')).toBeUndefined()
    })
  })

  describe('getPlatformForAccountPath', () => {
    it('should return correct platform for Lighting Source account', () => {
      expect(
        getPlatformForAccountPath(
          'Commissions Income:Retail Commissions:Lighting Source',
        ),
      ).toBe('lsi')
    })

    it('should return correct platform for Audible account', () => {
      expect(getPlatformForAccountPath('Commissions Income:Audible')).toBe(
        'audible',
      )
    })

    it('should return correct platform for third-party account', () => {
      expect(
        getPlatformForAccountPath(
          'Sales of Product Income:Book Sales Third Party',
        ),
      ).toBe('third-party')
    })

    it('should return undefined for unknown account path', () => {
      expect(getPlatformForAccountPath('Unknown:Account:Path')).toBeUndefined()
    })

    it('should return undefined for empty string', () => {
      expect(getPlatformForAccountPath('')).toBeUndefined()
    })
  })

  describe('getDisplayNameForPlatform', () => {
    it('should return correct display name for lsi', () => {
      expect(getDisplayNameForPlatform('lsi')).toBe('Print (Ingram)')
    })

    it('should return correct display name for kindle', () => {
      expect(getDisplayNameForPlatform('kindle')).toBe('Amazon Kindle')
    })

    it('should return correct display name for audible', () => {
      expect(getDisplayNameForPlatform('audible')).toBe('Audio (Audible)')
    })

    it('should return correct display name for kindle-unlimited', () => {
      expect(getDisplayNameForPlatform('kindle-unlimited')).toBe(
        'Kindle Unlimited',
      )
    })

    it('should return undefined for unknown platform', () => {
      expect(getDisplayNameForPlatform('unknown')).toBeUndefined()
    })
  })

  describe('getPlatformConfig', () => {
    it('should return full config for known platform', () => {
      const config = getPlatformConfig('audible')
      expect(config).toEqual({
        code: 'audible',
        displayName: 'Audio (Audible)',
        accountPath: 'Commissions Income:Audible',
      })
    })

    it('should return undefined for unknown platform', () => {
      expect(getPlatformConfig('unknown')).toBeUndefined()
    })
  })

  describe('getAllPlatformCodes', () => {
    it('should return all platform codes', () => {
      const codes = getAllPlatformCodes()
      expect(codes).toHaveLength(PLATFORM_MAPPINGS.length)
      expect(codes).toContain('lsi')
      expect(codes).toContain('kindle')
      expect(codes).toContain('audible')
      expect(codes).toContain('third-party')
    })

    it('should return an array of strings', () => {
      const codes = getAllPlatformCodes()
      for (const code of codes) {
        expect(typeof code).toBe('string')
      }
    })
  })

  describe('bidirectional mapping consistency', () => {
    it('should map platform to account path and back correctly', () => {
      for (const platform of PLATFORM_MAPPINGS) {
        const accountPath = getAccountPathForPlatform(platform.code)
        expect(accountPath).toBe(platform.accountPath)

        const platformCode = getPlatformForAccountPath(accountPath!)
        expect(platformCode).toBe(platform.code)
      }
    })
  })
})
