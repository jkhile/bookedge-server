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

    // Discussed with author (date strings, empty = not completed)
    fep_marketing_tips: Type.String(),
    author_website: Type.String(),
    author_social_media: Type.String(),
    unique_email: Type.String(),
    domain_name: Type.String(),
    author_photos: Type.String(),

    // Discussed and sent samples
    media_kit_sample: Type.String(),
    postcards_sample: Type.String(),
    tabletop_banners_sample: Type.String(),
    floor_banners_sample: Type.String(),
    bookplates_sample: Type.String(),
    cover_reveals_sample: Type.String(),
    book_opening_videos_sample: Type.String(),
    book_trailers_sample: Type.String(),
    amazon_author_page: Type.String(),
    bookmarks_sample: Type.String(),

    // Discussed and calculated
    book_pricing: Type.String(),
    book_pricing_email: Type.String(),

    // Created - Media Kit
    media_kit_created: Type.String(),
    media_kit_dmitri_checked: Type.String(),
    media_kit_uploaded: Type.String(),
    media_kit_sent_to_printer: Type.String(),

    // Created - Media Outreach
    media_outreach_list: Type.String(),

    // Created - Cover reveal
    cover_reveal_created: Type.String(),
    cover_reveal_youtube: Type.String(),

    // Created - Book opening video
    book_opening_video_created: Type.String(),
    book_opening_video_youtube: Type.String(),

    // Created - Book trailer
    book_trailer_created: Type.String(),
    book_trailer_dmitri_checked: Type.String(),
    book_trailer_youtube: Type.String(),

    // Created - A+ Marketing
    a_plus_marketing: Type.String(),
    a_plus_sent_to_dmitri: Type.String(),

    // Other created items
    press_release: Type.String(),

    // Specialty items
    specialty_postcards: Type.String(),
    specialty_tabletop_banners: Type.String(),
    specialty_floor_banners: Type.String(),
    specialty_bookplates: Type.String(),

    // Promo copies
    order_promo_copies: Type.String(),

    // Text fields
    cover_art_font: Type.String(),
    cover_art_colors: Type.String(),
    hashtags: Type.String(),

    // Notes fields (one per checklist group)
    notes_discussed_with_author: Type.String(),
    notes_discussed_sent_samples: Type.String(),
    notes_discussed_calculated: Type.String(),
    notes_created: Type.String(),
    notes_created_continued: Type.String(),

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
