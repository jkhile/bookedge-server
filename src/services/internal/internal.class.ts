/**
 * Internal Service Class
 *
 * Provides internal APIs for service-to-service communication.
 * This service exposes book metadata to authorized services like finutils.
 */
import type { Params } from '@feathersjs/feathers'
import { NotFound, BadRequest } from '@feathersjs/errors'
import type { Application } from '../../declarations'
import type { Knex } from 'knex'
import { getAccountPathForPlatform } from '../../utils/platform-mappings'
interface InternalParams extends Params {
  serviceClient?: 'finutils' | 'bookedge'
  query?: {
    action?: string
    accounting_code?: string
    isbn?: string
    code_prefix?: string
    q?: string
    limit?: number
    status?: string
  }
}

interface RevenueSplitOverrideResult {
  account_name: string
  fep_fixed_amount: number | null
  fep_percentage: number | null
  pub_fixed_amount: number | null
  pub_percentage: number | null
}

interface BookResult {
  id: number
  title: string
  subtitle: string
  accounting_code: string
  status: string
  isbn_paperback: string
  isbn_hardcover: string
  isbn_epub: string
  author?: string
  published_date?: string
  short_description?: string
  imprint: string // Marketing label
  // Revenue split configuration (FEP's share)
  fep_fixed_share_pb?: number
  fep_percentage_share_pb?: number
  fep_fixed_share_hc?: number
  fep_percentage_share_hc?: number
  // Platform-specific revenue split overrides
  revenue_split_overrides?: RevenueSplitOverrideResult[]
}

interface VendorResult {
  id: number
  code_prefix: string
  vendor_name: string
  statement_name: string
  generate_individual_statements: boolean
  status: string
}

interface HealthResult {
  status: string
  service: string
  caller?: string
  timestamp: string
}

export class InternalService {
  app: Application
  db: Knex

  constructor(app: Application) {
    this.app = app
    this.db = app.get('postgresqlClient')
  }

  /**
   * GET /internal - dispatch based on action query param
   */
  async find(
    params: InternalParams,
  ): Promise<
    | HealthResult
    | { books: BookResult[] }
    | { book: BookResult }
    | { vendors: VendorResult[] }
    | { vendor: VendorResult }
    | unknown
  > {
    const action = params.query?.action

    switch (action) {
      case 'health':
        return this.healthCheck(params)
      case 'search':
        return this.searchBooks(params)
      case 'get-by-accounting-code':
        return this.getBookByAccountingCode(
          params.query?.accounting_code || '',
          params,
        )
      case 'get-by-isbn':
        return this.getBookByIsbn(params.query?.isbn || '', params)
      case 'get-vendors':
        return this.getVendors(params)
      case 'get-vendor-by-prefix':
        return this.getVendorByPrefix(params.query?.code_prefix || '', params)
      default:
        return this.healthCheck(params)
    }
  }

  /**
   * GET /internal/:id - get a specific resource
   * id format: "books/by-accounting-code/CODE" or "books/by-isbn/ISBN"
   */
  async get(id: string, params: InternalParams): Promise<{ book: BookResult }> {
    const parts = id.split('/')

    if (parts[0] === 'books') {
      if (parts[1] === 'by-accounting-code' && parts[2]) {
        return this.getBookByAccountingCode(parts[2], params)
      }
      if (parts[1] === 'by-isbn' && parts[2]) {
        return this.getBookByIsbn(parts[2], params)
      }
    }

    throw new BadRequest(`Unknown internal resource: ${id}`)
  }

  /**
   * Health check endpoint
   */
  private healthCheck(params: InternalParams): HealthResult {
    return {
      status: 'ok',
      service: 'bookedge',
      caller: params.serviceClient,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Search books by title or author
   */
  private async searchBooks(
    params: InternalParams,
  ): Promise<{ books: BookResult[] }> {
    const { q, limit = 10 } = params.query || {}

    if (!q) {
      throw new BadRequest('Search query "q" is required')
    }

    const searchPattern = `%${q}%`

    const books = await this.db<BookResult>('books')
      .select(
        'id',
        'title',
        'subtitle',
        'accounting_code',
        'status',
        'isbn_paperback',
        'isbn_hardcover',
        'isbn_epub',
        'short_description',
        'imprint',
        'fep_fixed_share_pb',
        'fep_percentage_share_pb',
        'fep_fixed_share_hc',
        'fep_percentage_share_hc',
      )
      .where('title', 'ilike', searchPattern)
      .orWhere('subtitle', 'ilike', searchPattern)
      .orWhere('accounting_code', 'ilike', searchPattern)
      .limit(limit)

    return { books }
  }

  /**
   * Get a book by its accounting code
   */
  private async getBookByAccountingCode(
    accountingCode: string,
    _params: InternalParams,
  ): Promise<{ book: BookResult }> {
    // Order by status to prefer non-archived books when duplicates exist
    const book = await this.db<BookResult>('books')
      .select(
        'id',
        'title',
        'subtitle',
        'accounting_code',
        'status',
        'isbn_paperback',
        'isbn_hardcover',
        'isbn_epub',
        'short_description',
        'imprint',
        'fep_fixed_share_pb',
        'fep_percentage_share_pb',
        'fep_fixed_share_hc',
        'fep_percentage_share_hc',
      )
      .where('accounting_code', '=', accountingCode)
      .orderByRaw("CASE WHEN status = 'archived' THEN 1 ELSE 0 END")
      .first()

    if (!book) {
      throw new NotFound(
        `Book not found with accounting code: ${accountingCode}`,
      )
    }

    // Get author via book-contributor-roles
    const authorRow = await this.db('contributors')
      .select('contributors.published_name')
      .innerJoin(
        'book-contributor-roles',
        'contributors.id',
        'book-contributor-roles.fk_contributor',
      )
      .where('book-contributor-roles.fk_book', '=', book.id)
      .orderByRaw(
        'CASE WHEN "book-contributor-roles".contributor_role = \'Author\' THEN 0 ELSE 1 END',
      )
      .first()

    // Get published date
    const releaseRow = await this.db('releases')
      .select('publication_date')
      .where('fk_book', '=', book.id)
      .whereNot('publication_date', '=', '')
      .orderBy('publication_date', 'asc')
      .first()

    // Get revenue split overrides
    const overrides = await this.getRevenueSplitOverridesForBook(book.id)

    return {
      book: {
        ...book,
        author: authorRow?.published_name || undefined,
        published_date: releaseRow?.publication_date || undefined,
        revenue_split_overrides: overrides,
      },
    }
  }

  /**
   * Get a book by any ISBN (paperback, hardcover, or epub)
   */
  private async getBookByIsbn(
    isbn: string,
    _params: InternalParams,
  ): Promise<{ book: BookResult }> {
    // Order by status to prefer non-archived books when duplicates exist
    const book = await this.db<BookResult>('books')
      .select(
        'id',
        'title',
        'subtitle',
        'accounting_code',
        'status',
        'isbn_paperback',
        'isbn_hardcover',
        'isbn_epub',
        'short_description',
        'imprint',
        'fep_fixed_share_pb',
        'fep_percentage_share_pb',
        'fep_fixed_share_hc',
        'fep_percentage_share_hc',
      )
      .where((builder) => {
        builder
          .where('isbn_paperback', '=', isbn)
          .orWhere('isbn_hardcover', '=', isbn)
          .orWhere('isbn_epub', '=', isbn)
      })
      .orderByRaw("CASE WHEN status = 'archived' THEN 1 ELSE 0 END")
      .first()

    if (!book) {
      throw new NotFound(`Book not found with ISBN: ${isbn}`)
    }

    // Get author via book-contributor-roles
    const authorRow = await this.db('contributors')
      .select('contributors.published_name')
      .innerJoin(
        'book-contributor-roles',
        'contributors.id',
        'book-contributor-roles.fk_contributor',
      )
      .where('book-contributor-roles.fk_book', '=', book.id)
      .orderByRaw(
        'CASE WHEN "book-contributor-roles".contributor_role = \'Author\' THEN 0 ELSE 1 END',
      )
      .first()

    // Get published date
    const releaseRow = await this.db('releases')
      .select('publication_date')
      .where('fk_book', '=', book.id)
      .whereNot('publication_date', '=', '')
      .orderBy('publication_date', 'asc')
      .first()

    // Get revenue split overrides
    const overrides = await this.getRevenueSplitOverridesForBook(book.id)

    return {
      book: {
        ...book,
        author: authorRow?.published_name || undefined,
        published_date: releaseRow?.publication_date || undefined,
        revenue_split_overrides: overrides,
      },
    }
  }

  /**
   * Get revenue split overrides for a book, mapped to account names
   */
  private async getRevenueSplitOverridesForBook(
    bookId: number,
  ): Promise<RevenueSplitOverrideResult[]> {
    const overrides = await this.db('revenue-split-overrides')
      .select(
        'platform',
        'fep_fixed_amount',
        'fep_percentage',
        'pub_fixed_amount',
        'pub_percentage',
      )
      .where('fk_book', '=', bookId)

    // Map platform codes to account names
    return overrides
      .map((override) => {
        const accountName = getAccountPathForPlatform(override.platform)
        if (!accountName) {
          // Skip overrides with unknown platform codes
          return null
        }
        return {
          account_name: accountName,
          fep_fixed_amount: override.fep_fixed_amount,
          fep_percentage: override.fep_percentage,
          pub_fixed_amount: override.pub_fixed_amount,
          pub_percentage: override.pub_percentage,
        }
      })
      .filter((o): o is RevenueSplitOverrideResult => o !== null)
  }

  /**
   * Get all active vendors
   */
  private async getVendors(
    params: InternalParams,
  ): Promise<{ vendors: VendorResult[] }> {
    const status = params.query?.status || 'active'

    const query = this.db<VendorResult>('vendors')
      .select(
        'id',
        'code_prefix',
        'vendor_name',
        'statement_name',
        'generate_individual_statements',
        'status',
      )
      .orderBy('code_prefix', 'asc')

    if (status !== 'all') {
      query.where('status', '=', status)
    }

    const vendors = await query

    return { vendors }
  }

  /**
   * Get a vendor by code prefix
   */
  private async getVendorByPrefix(
    codePrefix: string,
    _params: InternalParams,
  ): Promise<{ vendor: VendorResult }> {
    if (!codePrefix) {
      throw new BadRequest('code_prefix is required')
    }

    const vendor = await this.db<VendorResult>('vendors')
      .select(
        'id',
        'code_prefix',
        'vendor_name',
        'statement_name',
        'generate_individual_statements',
        'status',
      )
      .where('code_prefix', '=', codePrefix)
      .first()

    if (!vendor) {
      throw new NotFound(`Vendor not found with code prefix: ${codePrefix}`)
    }

    return { vendor }
  }
}
