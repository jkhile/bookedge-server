/**
 * Finutils API Client
 *
 * Client for calling finutils internal APIs using service-to-service authentication.
 */
import axios from 'axios'
import type { AxiosInstance } from 'axios'
import type { Application } from '../declarations'
import { createServiceToken } from '../hooks/serviceAuthenticate'
import { logger } from '../logger'

/**
 * Accounting class from finutils
 */
export interface AccountingClass {
  id: string
  code: string
  display_name: string | null
  created_at: string
  updated_at: string
}

/**
 * Revenue summary row from finutils
 */
export interface RevenueSummaryRow {
  period: string
  platform: string
  total_revenue: string
  line_count: string
}

/**
 * Revenue summary response from finutils
 */
export interface RevenueSummaryResponse {
  accountingCode: string
  accountingClass: AccountingClass
  summary: RevenueSummaryRow[]
  totals: {
    revenue: number
    lineCount: number
  }
}

/**
 * Creates a finutils API client with service authentication
 */
export function createFinutilsClient(app: Application): FinutilsClient {
  return new FinutilsClient(app)
}

class FinutilsClient {
  private app: Application
  private client: AxiosInstance | null = null

  constructor(app: Application) {
    this.app = app
  }

  private getClient(): AxiosInstance {
    const authConfig = this.app.get('authentication') as {
      serviceAuth?: { secret?: string; finutils_url?: string }
    }
    const finutilsUrl = authConfig?.serviceAuth?.finutils_url

    if (!finutilsUrl) {
      throw new Error('FINUTILS_API_URL is not configured')
    }

    if (!this.client) {
      this.client = axios.create({
        baseURL: finutilsUrl,
        timeout: 30000,
      })

      // Add request interceptor to add service auth token
      this.client.interceptors.request.use((config) => {
        const token = createServiceToken(this.app, 'finutils')
        config.headers.Authorization = `Bearer ${token}`
        return config
      })
    }

    return this.client
  }

  /**
   * Check if finutils integration is configured
   */
  isConfigured(): boolean {
    const authConfig = this.app.get('authentication') as {
      serviceAuth?: { secret?: string; finutils_url?: string }
    }
    return Boolean(
      authConfig?.serviceAuth?.secret && authConfig?.serviceAuth?.finutils_url,
    )
  }

  /**
   * Health check for finutils service
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await this.getClient().get<{
      status: string
      service: string
    }>('/api/internal/health')
    return response.data
  }

  /**
   * Get all accounting classes from finutils
   */
  async getAccountingClasses(options?: {
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ accountingClasses: AccountingClass[] }> {
    const params = new URLSearchParams()
    if (options?.search) params.set('search', options.search)
    if (options?.limit) params.set('limit', options.limit.toString())
    if (options?.offset) params.set('offset', options.offset.toString())

    const response = await this.getClient().get<{
      accountingClasses: AccountingClass[]
    }>(`/api/internal/accounting-classes?${params.toString()}`)
    return response.data
  }

  /**
   * Get an accounting class by its code
   */
  async getAccountingClassByCode(
    code: string,
  ): Promise<AccountingClass | null> {
    try {
      const response = await this.getClient().get<{
        accountingClass: AccountingClass
      }>(`/api/internal/accounting-classes/${encodeURIComponent(code)}`)
      return response.data.accountingClass
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      logger.error('Error fetching accounting class from finutils', {
        error,
        code,
      })
      throw error
    }
  }

  /**
   * Get revenue summary for a book by its accounting code
   */
  async getRevenueSummary(
    accountingCode: string,
    options?: {
      startPeriod?: string
      endPeriod?: string
    },
  ): Promise<RevenueSummaryResponse | null> {
    try {
      const params = new URLSearchParams()
      if (options?.startPeriod) params.set('startPeriod', options.startPeriod)
      if (options?.endPeriod) params.set('endPeriod', options.endPeriod)

      const response = await this.getClient().get<RevenueSummaryResponse>(
        `/api/internal/revenue-summary/${encodeURIComponent(accountingCode)}?${params.toString()}`,
      )
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      logger.error('Error fetching revenue summary from finutils', {
        error,
        accountingCode,
      })
      throw error
    }
  }
}

export { FinutilsClient }
