import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { imprintsResolver } from '../../utils/imprints-resolver'
import {
  createDataResolver,
  createUpdateResolver,
} from '../../utils/update-resolver'
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
    project_priorities: Type.String(),
    notes: Type.String(),
    media_kit_link: Type.String(),
    discussion_guide_link: Type.String(),
    book_trailer_link: Type.String(),
    cover_reveal_link: Type.String(),
    proposed_presale_date: Type.String(),
    proposed_on_sale_date: Type.String(),
    cover_text_submitted_date: Type.String(),
    supplementary_notes: Type.String(),
    marketing_notes: Type.String(),
    fk_created_by: Type.Optional(Type.Integer()),
    created_at: Type.Optional(Type.String({ format: 'date-time' })),
    fk_updated_by: Type.Optional(Type.Integer()),
    updated_at: Type.Optional(Type.String({ format: 'date-time' })),
    // virtual fields - all should be optional since they're calculated by the server
    author: Type.Optional(Type.String()),
    published_date: Type.Optional(Type.String()),
    issues_count: Type.Optional(Type.Number()), // Changed from Integer to Number to be more permissive
  },
  { $id: 'Book', additionalProperties: false },
)
export type Book = Static<typeof bookSchema>
export const bookValidator = getValidator(bookSchema, dataValidator)
// Helper function to get book data regardless of method
export const bookResolver = resolve<Book, HookContext<BookService>>({
  // No need for virtual author property as it now comes from the subquery
  // No need for virtual published_date property as it now comes from the subquery
  // No need for virtual issues_count property as it now comes from the subquery
})
export const bookExternalResolver = resolve<Book, HookContext<BookService>>({})

// Schema for creating new entries
export const bookDataSchema = Type.Omit(
  bookSchema,
  // Only omit fields that are set by the server, leave virtual fields in the schema
  ['id', 'fk_created_by', 'created_at', 'fk_updated_by', 'updated_at'],
  {
    $id: 'BookData',
  },
)
export type BookData = Static<typeof bookDataSchema>
export const bookDataValidator = getValidator(bookDataSchema, dataValidator)
export const bookDataResolver = createDataResolver<Book>()

// Schema for updating existing entries
export const bookPatchSchema = Type.Partial(bookSchema, {
  $id: 'BookPatch',
})
export type BookPatch = Static<typeof bookPatchSchema>
export const bookPatchValidator = getValidator(bookPatchSchema, dataValidator)
export const bookPatchResolver = createUpdateResolver<Book>()

// Schema for allowed query properties
export const bookQueryProperties = Type.Omit(bookSchema, [
  'author',
  'published_date',
  'issues_count',
])
export const bookQuerySchema = Type.Intersect(
  [
    querySyntax(bookQueryProperties),
    // Add additional query properties here
    Type.Object(
      {
        // Allow querying by author, published_date, and issues_count, but make them optional
        author: Type.Optional(Type.String()),
        published_date: Type.Optional(Type.String()),
        issues_count: Type.Optional(Type.Number()), // Keep as Number to match main schema
      },
      { additionalProperties: false },
    ),
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
