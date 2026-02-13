import type { Knex } from 'knex'

// All boolean checklist columns to convert to text
const booleanColumns = [
  // Discussed with author
  'fep_marketing_tips',
  'author_website',
  'author_social_media',
  'unique_email',
  'domain_name',
  'author_photos',
  // Discussed and sent samples
  'media_kit_sample',
  'postcards_sample',
  'tabletop_banners_sample',
  'floor_banners_sample',
  'bookplates_sample',
  'cover_reveals_sample',
  'book_opening_videos_sample',
  'book_trailers_sample',
  'amazon_author_page',
  'bookmarks_sample',
  // Discussed and calculated
  'book_pricing',
  'book_pricing_email',
  // Created - Media Kit
  'media_kit_created',
  'media_kit_dmitri_checked',
  'media_kit_uploaded',
  'media_kit_sent_to_printer',
  // Created - Media Outreach
  'media_outreach_list',
  // Created - Cover reveal
  'cover_reveal_created',
  'cover_reveal_youtube',
  // Created - Book opening video
  'book_opening_video_created',
  'book_opening_video_youtube',
  // Created - Book trailer
  'book_trailer_created',
  'book_trailer_dmitri_checked',
  'book_trailer_youtube',
  // Created - A+ Marketing
  'a_plus_marketing',
  'a_plus_sent_to_dmitri',
  // Other created items
  'press_release',
  // Specialty items
  'specialty_postcards',
  'specialty_tabletop_banners',
  'specialty_floor_banners',
  'specialty_bookplates',
  // Promo copies
  'order_promo_copies',
]

export async function up(knex: Knex): Promise<void> {
  for (const col of booleanColumns) {
    await knex.schema.alterTable('marketing_checklists', (table) => {
      table.text(col).defaultTo('').alter()
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const col of booleanColumns) {
    await knex.schema.alterTable('marketing_checklists', (table) => {
      table.boolean(col).defaultTo(false).alter()
    })
  }
}
