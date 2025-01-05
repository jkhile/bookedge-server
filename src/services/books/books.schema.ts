import { resolve, virtual } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { formatISO } from 'date-fns'
import { imprintsResolver } from '../../utils/imprints-resolver'
import { dataValidator, queryValidator } from '../../validators'

// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import type { BookService } from './books.class'

// Main data model schema
export const bookSchema = Type.Object(
  {
    id: Type.Integer(),
    fk_imprint: Type.Integer(),
    fk_derived_from: Type.Union([Type.Integer(), Type.Null()]),
    derived_type: Type.Union([
      Type.Literal('original'),
      Type.Literal('revision'),
      Type.Literal('edition'),
      Type.Literal('customization'),
    ]),
    title: Type.String(),
    title_finalized: Type.Boolean(),
    subtitle: Type.String(),
    subtitle_finalized: Type.Boolean(),
    accounting_code: Type.String(),
    fep_percentage_share_hc: Type.Number(),
    fep_fixed_share_hc: Type.Number(),
    fep_percentage_share_pb: Type.Number(),
    fep_fixed_share_pb: Type.Number(),
    status: Type.Union([
      Type.Literal('archived'),
      Type.Literal('contract negotiation'),
      Type.Literal('contract signed'),
      Type.Literal('content editing'),
      Type.Literal('copy editing'),
      Type.Literal('print layout'),
      Type.Literal('proofing'),
      Type.Literal('pre-order'),
      Type.Literal('released'),
    ]),
    isbn_paperback: Type.String(),
    isbn_hardcover: Type.String(),
    isbn_epub: Type.String(),
    isbn_ibooks: Type.String(),
    copyright_holder: Type.String(),
    copyright_year: Type.String(),
    language: Type.String(),
    short_description: Type.String(),
    short_description_finalized: Type.Boolean(),
    long_description: Type.String(),
    long_description_finalized: Type.Boolean(),
    back_cover_text: Type.String(),
    back_cover_text_finalized: Type.Boolean(),
    jacket_front_text: Type.String(),
    jacket_front_text_finalized: Type.Boolean(),
    jacket_back_text: Type.String(),
    jacket_back_text_finalized: Type.Boolean(),
    is_public_domain: Type.Boolean(),
    keywords: Type.String(),
    keywords_finalized: Type.Boolean(),
    kdp_keywords: Type.String(),
    kdp_keywords_finalized: Type.Boolean(),
    bisac_code_1: Type.String(),
    bisac_name_1: Type.String(),
    bisac_code_2: Type.String(),
    bisac_name_2: Type.String(),
    bisac_code_3: Type.String(),
    bisac_name_3: Type.String(),
    amazon_category_1: Type.String(),
    amazon_category_2: Type.String(),
    amazon_category_3: Type.String(),
    thema: Type.String(),
    audience: Type.Union([
      Type.Literal(''),
      Type.Literal('Trade/General (Adult)'),
      Type.Literal('Young Adult (Child 13-18)'),
      Type.Literal('Juvenile(Child 0-12)'),
      Type.Literal('Professional/Scholar (Adult)'),
      Type.Literal('College (Textbook)'),
      Type.Literal('Elementary/High School (Textbook)'),
    ]),
    series_name: Type.String(),
    series_number: Type.Integer(),
    edition_name: Type.String(),
    edition_number: Type.Integer(),
    right_to_left: Type.Boolean(),
    contains_prior_work: Type.String(),
    contains_others_work: Type.String(),
    web_domain: Type.String(),
    published_word_count: Type.Integer(),
    image_count: Type.Integer(),
    press_contact: Type.String(),
    legal_notice: Type.String(),
    featured_ads: Type.String(),
    cover_file: Type.String(),
    interior_file: Type.String(),
    other_files: Type.String(),
    goodreads_reviews_link: Type.String(),
    amazon_sales_page_link: Type.String(),
    amazon_a_plus_link: Type.String(),
    a_plus_description_1: Type.String(),
    a_plus_text_1: Type.String(),
    a_plus_is_live_1: Type.Boolean(),
    a_plus_rejection_reason_1: Type.String(),
    a_plus_image_1: Type.String(),
    a_plus_description_2: Type.String(),
    a_plus_text_2: Type.String(),
    a_plus_is_live_2: Type.Boolean(),
    a_plus_rejection_reason_2: Type.String(),
    a_plus_image_2: Type.String(),
    a_plus_description_3: Type.String(),
    a_plus_text_3: Type.String(),
    a_plus_is_live_3: Type.Boolean(),
    a_plus_rejection_reason_3: Type.String(),
    a_plus_image_3: Type.String(),
    errata: Type.String(),
    notes: Type.String(),
    fk_created_by: Type.Integer(),
    created_at: Type.String({ format: 'date-time' }),
    // virtual fields
    author: Type.Optional(Type.String()),
    published_date: Type.String(),
    issues_count: Type.Integer(),
  },
  { $id: 'Book', additionalProperties: false },
)
export type Book = Static<typeof bookSchema>
export const bookValidator = getValidator(bookSchema, dataValidator)
// Helper function to get book data regardless of method
const getBookData = (context: HookContext<BookService>) => {
  if (!context.result) return null

  // If it's a 'find' operation, result will have a data property
  if ('data' in context.result) {
    return Array.isArray(context.result.data) ? context.result.data : null
  }

  // If it's a 'get' operation, result will be the book object
  return Array.isArray(context.result) ? context.result : [context.result]
}

export const bookResolver = resolve<Book, HookContext<BookService>>({
  author: virtual(async (book, context) => {
    if (context.method === 'search') return ''

    const bookData = getBookData(context)
    if (!bookData) throw new Error('No result data available in context')

    context.authorIx = 'authorIx' in context ? context.authorIx + 1 : 0
    if (context.authorIx >= bookData.length) return ''

    const contributorsService = context.app.service('contributors')
    const bookId = bookData[context.authorIx].id

    const contributors = await contributorsService.find({
      query: {
        fk_book: bookId,
        $select: ['contributor_role', 'published_name'],
      },
    })

    if (!contributors.data.length) return ''

    const authorContrib = contributors.data.find(
      (contributor) => contributor.contributor_role === 'Author',
    )
    return authorContrib
      ? authorContrib.published_name
      : contributors.data[0].published_name
  }),

  published_date: virtual(async (book, context) => {
    if (context.method === 'search') return ''

    const bookData = getBookData(context)
    if (!bookData) throw new Error('No result data available in context')

    context.dateIx = 'dateIx' in context ? context.dateIx + 1 : 0
    if (context.dateIx >= bookData.length) return ''

    const releasesService = context.app.service('releases')
    const bookId = bookData[context.dateIx].id

    const releases = await releasesService.find({
      query: {
        fk_book: bookId,
        $select: ['publication_date'],
        $sort: { publication_date: 1 },
        $limit: 1,
      },
    })

    return releases.data.length ? releases.data[0].publication_date : ''
  }),

  issues_count: virtual(async (book, context) => {
    if (context.method === 'search') return 0

    const bookData = getBookData(context)
    if (!bookData) throw new Error('No result data available in context')

    context.issueIx = 'issueIx' in context ? context.issueIx + 1 : 0
    if (context.issueIx >= bookData.length) return 0

    const issuesService = context.app.service('issues')
    const bookId = bookData[context.issueIx].id

    const issues = await issuesService.find({
      query: {
        fk_book: bookId,
        resolved: false,
        $limit: 0,
      },
    })

    return issues.total
  }),
})
export const bookExternalResolver = resolve<Book, HookContext<BookService>>({})

// Schema for creating new entries
export const bookDataSchema = Type.Omit(
  bookSchema,
  ['id', 'fk_created_by', 'created_at'],
  {
    $id: 'BookData',
  },
)
export type BookData = Static<typeof bookDataSchema>
export const bookDataValidator = getValidator(bookDataSchema, dataValidator)
export const bookDataResolver = resolve<Book, HookContext<BookService>>({
  created_at: async () => formatISO(new Date()),
  fk_created_by: async (value, data, context) => context.params.user?.id,
})

// Schema for updating existing entries
export const bookPatchSchema = Type.Partial(bookSchema, {
  $id: 'BookPatch',
})
export type BookPatch = Static<typeof bookPatchSchema>
export const bookPatchValidator = getValidator(bookPatchSchema, dataValidator)
export const bookPatchResolver = resolve<Book, HookContext<BookService>>({})

// Schema for allowed query properties
export const bookQueryProperties = Type.Omit(bookSchema, [])
export const bookQuerySchema = Type.Intersect(
  [
    querySyntax(bookQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type BookQuery = Static<typeof bookQuerySchema>
export const bookQueryValidator = getValidator(bookQuerySchema, queryValidator)
export const bookQueryResolver = resolve<BookQuery, HookContext<BookService>>({
  fk_imprint: imprintsResolver,
})
export const bookSearchQuerySchema = Type.Object(
  {
    fields: Type.Array(Type.String()),
    query: Type.String(),
  },
  { $id: 'BookSearchQuery', additionalProperties: false },
)
export type BookSearchQuery = Static<typeof bookSearchQuerySchema>
export const bookSearchQueryValidator = getValidator(
  bookSearchQuerySchema,
  queryValidator,
)
