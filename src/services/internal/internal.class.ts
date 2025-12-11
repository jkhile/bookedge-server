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

interface InternalParams extends Params {
  serviceClient?: 'finutils' | 'bookedge'
  query?: {
    action?: string
    accounting_code?: string
    isbn?: string
    q?: string
    limit?: number
    status?: string
  }
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
  fk_imprint: number
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
  ): Promise<HealthResult | { books: BookResult[] }> {
    const action = params.query?.action

    switch (action) {
      case 'health':
        return this.healthCheck(params)
      case 'search':
        return this.searchBooks(params)
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
        'fk_imprint',
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
        'fk_imprint',
      )
      .where('accounting_code', '=', accountingCode)
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

    return {
      book: {
        ...book,
        author: authorRow?.published_name || undefined,
        published_date: releaseRow?.publication_date || undefined,
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
        'fk_imprint',
      )
      .where('isbn_paperback', '=', isbn)
      .orWhere('isbn_hardcover', '=', isbn)
      .orWhere('isbn_epub', '=', isbn)
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

    return {
      book: {
        ...book,
        author: authorRow?.published_name || undefined,
        published_date: releaseRow?.publication_date || undefined,
      },
    }
  }
}
