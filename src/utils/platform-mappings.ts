/**
 * Platform Mappings
 *
 * Maps platform codes to QuickBooks account paths for revenue split overrides.
 * These mappings align with the channel-mappings in finutils.
 */

export interface PlatformConfig {
  /** Platform code stored in database */
  code: string
  /** Human-readable display name for UI */
  displayName: string
  /** QuickBooks account path for finutils */
  accountPath: string
}

/**
 * Platform configurations for revenue split overrides.
 * The account paths match the production naming in finutils channel-mappings.
 */
export const PLATFORM_MAPPINGS: PlatformConfig[] = [
  {
    code: 'lsi',
    displayName: 'Print (Ingram)',
    accountPath: 'Commissions Income:Retail Commissions:Lighting Source',
  },
  {
    code: 'kindle',
    displayName: 'Amazon Kindle',
    accountPath: 'Commissions Income:Retail Commissions:Kindle',
  },
  {
    code: 'nook',
    displayName: 'Barnes & Noble Nook',
    accountPath: 'Commissions Income:Retail Commissions:Nook',
  },
  {
    code: 'apple',
    displayName: 'Apple iBook',
    accountPath: 'Commissions Income:Retail Commissions:Apple',
  },
  {
    code: 'google',
    displayName: 'Google Play',
    accountPath: 'Commissions Income:Retail Commissions:Google',
  },
  {
    code: 'kobo',
    displayName: 'Kobo',
    accountPath: 'Commissions Income:Retail Commissions:Kobo',
  },
  {
    code: 'audible',
    displayName: 'Audio (Audible)',
    accountPath: 'Commissions Income:Audible',
  },
  {
    code: 'kindle-unlimited',
    displayName: 'Kindle Unlimited',
    accountPath: 'Commissions Income:Sharing Program Kindle',
  },
  {
    code: 'kobo-plus',
    displayName: 'Kobo Plus',
    accountPath: 'Commissions Income:Sharing Kobo',
  },
  {
    code: 'aerio',
    displayName: 'Aerio',
    accountPath: 'Commissions Income:Retail Commissions:Aerio Retail',
  },
  {
    code: 'third-party',
    displayName: 'Direct to 3rd Party',
    accountPath: 'Sales of Product Income:Book Sales Third Party',
  },
]

/**
 * Map of platform codes to their configurations for quick lookup
 */
const platformByCode = new Map<string, PlatformConfig>(
  PLATFORM_MAPPINGS.map((p) => [p.code, p]),
)

/**
 * Map of account paths to their platform configurations for reverse lookup
 */
const platformByAccountPath = new Map<string, PlatformConfig>(
  PLATFORM_MAPPINGS.map((p) => [p.accountPath, p]),
)

/**
 * Get the account path for a given platform code
 */
export function getAccountPathForPlatform(
  platformCode: string,
): string | undefined {
  return platformByCode.get(platformCode)?.accountPath
}

/**
 * Get the platform code for a given account path
 */
export function getPlatformForAccountPath(
  accountPath: string,
): string | undefined {
  return platformByAccountPath.get(accountPath)?.code
}

/**
 * Get the display name for a given platform code
 */
export function getDisplayNameForPlatform(
  platformCode: string,
): string | undefined {
  return platformByCode.get(platformCode)?.displayName
}

/**
 * Get full platform configuration by code
 */
export function getPlatformConfig(
  platformCode: string,
): PlatformConfig | undefined {
  return platformByCode.get(platformCode)
}

/**
 * Get all valid platform codes
 */
export function getAllPlatformCodes(): string[] {
  return PLATFORM_MAPPINGS.map((p) => p.code)
}
