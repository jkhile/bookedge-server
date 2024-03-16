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
    subtitle: Type.String(),
    accounting_code: Type.String(),
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
    long_description: Type.String(),
    back_cover_text: Type.String(),
    jacket_front_text: Type.String(),
    jacket_back_text: Type.String(),
    is_public_domain: Type.Boolean(),
    keywords: Type.String(),
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
    errata: Type.String(),
    notes: Type.String(),
    fk_created_by: Type.Integer(),
    created_at: Type.String({ format: 'date-time' }),
    // virtual fields
    author: Type.String(),
    published_date: Type.String(),
  },
  { $id: 'Book', additionalProperties: false },
)
export type Book = Static<typeof bookSchema>
export const bookValidator = getValidator(bookSchema, dataValidator)
export const bookResolver = resolve<Book, HookContext<BookService>>({
  author: virtual(async (user, context) => {
    // Look up the author of the book and set as a virtual field on the book
    // for display in the books list
    // @ts-ignore
    if (!context.result) {
      throw new Error('No result in context in bookResolver author')
    }
    // a get won't return a paginated result like find, so fake it to
    // simplify the following code
    // @ts-ignore
    if (!context.result.data) {
      // @ts-ignore
      context.result.data = [context.result]
    }
    let author = ''
    context.authorIx = 'authorIx' in context ? context.authorIx + 1 : 0
    const contributorsService = context.app.service('contributors')
    // @ts-ignore
    const bookId = context.result.data[context.authorIx]['id']
    const contributors = await contributorsService.find({
      query: {
        fk_book: bookId,
        $select: ['contributor_role', 'published_name'],
      },
    })

    if (contributors.data.length > 0) {
      const contrib = contributors.data.find(
        (contributor) => contributor.contributor_role === 'Author',
      )
      author = contrib
        ? contrib.published_name
        : contributors.data[0].published_name
    }
    return author
  }),

  published_date: virtual(async (user, context) => {
    // @ts-ignore
    if (!context.result) {
      throw new Error('No result in context in bookResolver author')
    }
    let published_date = ''
    context.dateIx = 'dateIx' in context ? context.dateIx + 1 : 0
    const releasesService = context.app.service('releases')
    // @ts-ignore
    const bookId = context.result.data[context.authorIx]['id']
    const releases = await releasesService.find({
      query: {
        fk_book: bookId,
        $select: ['publication_date'],
        $sort: { publication_date: 1 },
        $limit: 1,
      },
    })
    if (releases.data.length > 0) {
      published_date = releases.data[0]['publication_date']
    }

    return published_date
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
