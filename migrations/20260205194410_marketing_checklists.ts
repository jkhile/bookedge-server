import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('marketing_checklists', (table) => {
    // Primary key
    table.increments('id').primary()

    // Foreign key to books (1:1 relationship)
    table.integer('book_id').notNullable().unique()
    table
      .foreign('book_id')
      .references('id')
      .inTable('books')
      .onDelete('CASCADE')

    // Discussed with author
    table.boolean('fep_marketing_tips').defaultTo(false)
    table.boolean('author_website').defaultTo(false)
    table.boolean('author_social_media').defaultTo(false)
    table.boolean('unique_email').defaultTo(false)
    table.boolean('domain_name').defaultTo(false)
    table.boolean('author_photos').defaultTo(false)

    // Discussed and sent samples
    table.boolean('media_kit_sample').defaultTo(false)
    table.boolean('postcards_sample').defaultTo(false)
    table.boolean('tabletop_banners_sample').defaultTo(false)
    table.boolean('floor_banners_sample').defaultTo(false)
    table.boolean('bookplates_sample').defaultTo(false)
    table.boolean('cover_reveals_sample').defaultTo(false)
    table.boolean('book_opening_videos_sample').defaultTo(false)
    table.boolean('book_trailers_sample').defaultTo(false)
    table.boolean('amazon_author_page').defaultTo(false)
    table.boolean('bookmarks_sample').defaultTo(false)

    // Discussed and calculated
    table.boolean('book_pricing').defaultTo(false)
    table.boolean('book_pricing_email').defaultTo(false)

    // Created - Media Kit
    table.boolean('media_kit_created').defaultTo(false)
    table.boolean('media_kit_dmitri_checked').defaultTo(false)
    table.boolean('media_kit_uploaded').defaultTo(false)
    table.boolean('media_kit_sent_to_printer').defaultTo(false)

    // Created - Media Outreach
    table.boolean('media_outreach_list').defaultTo(false)

    // Created - Cover reveal
    table.boolean('cover_reveal_created').defaultTo(false)
    table.boolean('cover_reveal_youtube').defaultTo(false)

    // Created - Book opening video
    table.boolean('book_opening_video_created').defaultTo(false)
    table.boolean('book_opening_video_youtube').defaultTo(false)

    // Created - Book trailer
    table.boolean('book_trailer_created').defaultTo(false)
    table.boolean('book_trailer_dmitri_checked').defaultTo(false)
    table.boolean('book_trailer_youtube').defaultTo(false)

    // Created - A+ Marketing
    table.boolean('a_plus_marketing').defaultTo(false)
    table.boolean('a_plus_sent_to_dmitri').defaultTo(false)

    // Other created items
    table.boolean('press_release').defaultTo(false)

    // Specialty items
    table.boolean('specialty_postcards').defaultTo(false)
    table.boolean('specialty_tabletop_banners').defaultTo(false)
    table.boolean('specialty_floor_banners').defaultTo(false)
    table.boolean('specialty_bookplates').defaultTo(false)

    // Promo copies
    table.boolean('order_promo_copies').defaultTo(false)

    // Text fields
    table.text('cover_art_font').defaultTo('')
    table.text('cover_art_colors').defaultTo('')
    table.text('hashtags').defaultTo('')

    // System audit fields
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.integer('fk_created_by')
    table.integer('fk_updated_by')

    // Foreign keys for audit fields
    table
      .foreign('fk_created_by')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
    table
      .foreign('fk_updated_by')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')

    // Indexes
    table.index(['book_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('marketing_checklists')
}
