import { dataValidator, queryValidator } from '../../validators'
import { getValidator, querySyntax, Type } from '@feathersjs/typebox'
import { resolve } from '@feathersjs/schema'
import {
  createDataResolver,
  createUpdateResolver,
} from '../../utils/update-resolver'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import type { MarketingChecklistService } from './marketing-checklists.class'

// Main data model schema
export const marketingChecklistSchema = Type.Object(
  {
    id: Type.Integer(),
    book_id: Type.Integer(),

    // Discussed with author
    fep_marketing_tips: Type.Boolean(),
    author_website: Type.Boolean(),
    author_social_media: Type.Boolean(),
    unique_email: Type.Boolean(),
    domain_name: Type.Boolean(),
    author_photos: Type.Boolean(),

    // Discussed and sent samples
    media_kit_sample: Type.Boolean(),
    postcards_sample: Type.Boolean(),
    tabletop_banners_sample: Type.Boolean(),
    floor_banners_sample: Type.Boolean(),
    bookplates_sample: Type.Boolean(),
    cover_reveals_sample: Type.Boolean(),
    book_opening_videos_sample: Type.Boolean(),
    book_trailers_sample: Type.Boolean(),
    amazon_author_page: Type.Boolean(),
    bookmarks_sample: Type.Boolean(),

    // Discussed and calculated
    book_pricing: Type.Boolean(),
    book_pricing_email: Type.Boolean(),

    // Created - Media Kit
    media_kit_created: Type.Boolean(),
    media_kit_dmitri_checked: Type.Boolean(),
    media_kit_uploaded: Type.Boolean(),
    media_kit_sent_to_printer: Type.Boolean(),

    // Created - Media Outreach
    media_outreach_list: Type.Boolean(),

    // Created - Cover reveal
    cover_reveal_created: Type.Boolean(),
    cover_reveal_youtube: Type.Boolean(),

    // Created - Book opening video
    book_opening_video_created: Type.Boolean(),
    book_opening_video_youtube: Type.Boolean(),

    // Created - Book trailer
    book_trailer_created: Type.Boolean(),
    book_trailer_dmitri_checked: Type.Boolean(),
    book_trailer_youtube: Type.Boolean(),

    // Created - A+ Marketing
    a_plus_marketing: Type.Boolean(),
    a_plus_sent_to_dmitri: Type.Boolean(),

    // Other created items
    press_release: Type.Boolean(),

    // Specialty items
    specialty_postcards: Type.Boolean(),
    specialty_tabletop_banners: Type.Boolean(),
    specialty_floor_banners: Type.Boolean(),
    specialty_bookplates: Type.Boolean(),

    // Promo copies
    order_promo_copies: Type.Boolean(),

    // Text fields
    cover_art_font: Type.String(),
    cover_art_colors: Type.String(),
    hashtags: Type.String(),

    // Audit fields
    fk_created_by: Type.Optional(Type.Integer()),
    created_at: Type.Optional(Type.String({ format: 'date-time' })),
    fk_updated_by: Type.Optional(Type.Integer()),
    updated_at: Type.Optional(Type.String({ format: 'date-time' })),
  },
  { $id: 'MarketingChecklist', additionalProperties: false },
)
export type MarketingChecklist = Static<typeof marketingChecklistSchema>
export const marketingChecklistValidator = getValidator(
  marketingChecklistSchema,
  dataValidator,
)
export const marketingChecklistResolver = resolve<
  MarketingChecklist,
  HookContext<MarketingChecklistService>
>({})

export const marketingChecklistExternalResolver = resolve<
  MarketingChecklist,
  HookContext<MarketingChecklistService>
>({})

// Schema for creating new entries
export const marketingChecklistDataSchema = Type.Omit(
  marketingChecklistSchema,
  ['id', 'fk_created_by', 'created_at', 'fk_updated_by', 'updated_at'],
  {
    $id: 'MarketingChecklistData',
  },
)
export type MarketingChecklistData = Static<typeof marketingChecklistDataSchema>
export const marketingChecklistDataValidator = getValidator(
  marketingChecklistDataSchema,
  dataValidator,
)
export const marketingChecklistDataResolver = resolve<
  MarketingChecklist,
  HookContext<MarketingChecklistService>
>(createDataResolver<MarketingChecklist>())

// Schema for updating existing entries
export const marketingChecklistPatchSchema = Type.Partial(
  marketingChecklistSchema,
  {
    $id: 'MarketingChecklistPatch',
  },
)
export type MarketingChecklistPatch = Static<
  typeof marketingChecklistPatchSchema
>
export const marketingChecklistPatchValidator = getValidator(
  marketingChecklistPatchSchema,
  dataValidator,
)
export const marketingChecklistPatchResolver = resolve<
  MarketingChecklist,
  HookContext<MarketingChecklistService>
>(createUpdateResolver<MarketingChecklist>())

// Schema for allowed query properties
export const marketingChecklistQueryProperties = Type.Omit(
  marketingChecklistSchema,
  [],
)
export const marketingChecklistQuerySchema = Type.Intersect(
  [
    querySyntax(marketingChecklistQueryProperties),
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
)
export type MarketingChecklistQuery = Static<
  typeof marketingChecklistQuerySchema
>
export const marketingChecklistQueryValidator = getValidator(
  marketingChecklistQuerySchema,
  queryValidator,
)
export const marketingChecklistQueryResolver = resolve<
  MarketingChecklistQuery,
  HookContext<MarketingChecklistService>
>({})
