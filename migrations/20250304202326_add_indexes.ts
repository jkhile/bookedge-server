import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Books table indexes
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_books_status ON books(status)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_books_title ON books(title)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_books_fk_imprint ON books(fk_imprint)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_books_fk_derived_from ON books(fk_derived_from)',
  )

  // Books history indexes
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_books_history_fk_book ON "books-history"(fk_book)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_books_history_change_date ON "books-history"(change_date)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_books_history_book_date ON "books-history"(fk_book, change_date)',
  )

  // Contributors indexes
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_contributors_fk_book ON contributors(fk_book)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_contributors_role ON contributors(contributor_role)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_contributors_published_name ON contributors(published_name)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_contributors_book_role ON contributors(fk_book, contributor_role)',
  )

  // Endorsements indexes
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_endorsements_fk_book ON endorsements(fk_book)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_endorsements_by ON endorsements("by")',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_endorsements_priority ON endorsements(priority)',
  )

  // Imprints indexes
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_imprints_status ON imprints(status)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_imprints_name ON imprints(imprint_name)',
  )

  // Issues indexes
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_issues_fk_book ON issues(fk_book)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_issues_resolved ON issues(resolved)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_issues_book_resolved ON issues(fk_book, resolved)',
  )

  // Mentions indexes
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_mentions_fk_book ON mentions(fk_book)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_mentions_date ON mentions(date)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_mentions_book_date ON mentions(fk_book, date)',
  )

  // Pricings indexes
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_pricings_fk_release ON pricings(fk_release)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_pricings_start_date ON pricings(start_date)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_pricings_release_date ON pricings(fk_release, start_date)',
  )

  // Releases indexes
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_releases_fk_book ON releases(fk_book)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_releases_status ON releases(status)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_releases_type ON releases(release_type)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_releases_publication_date ON releases(publication_date)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_releases_book_status ON releases(fk_book, status)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_releases_book_type ON releases(fk_book, release_type)',
  )

  // Review quotes indexes
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_review_quotes_fk_book ON "review-quotes"(fk_book)',
  )

  // Signin history indexes
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_signin_history_fk_user ON "signin-history"(fk_user)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_signin_history_datetime ON "signin-history"(datetime)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_signin_history_user_datetime ON "signin-history"(fk_user, datetime)',
  )

  // Users indexes
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',
  )
  await knex.schema.raw(
    'CREATE INDEX IF NOT EXISTS idx_users_roles ON users(roles)',
  )
}

export async function down(knex: Knex): Promise<void> {
  // Books table indexes
  await knex.schema.raw('DROP INDEX IF EXISTS idx_books_status')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_books_title')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_books_fk_imprint')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_books_fk_derived_from')

  // Books history indexes
  await knex.schema.raw('DROP INDEX IF EXISTS idx_books_history_fk_book')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_books_history_change_date')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_books_history_book_date')

  // Contributors indexes
  await knex.schema.raw('DROP INDEX IF EXISTS idx_contributors_fk_book')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_contributors_role')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_contributors_published_name')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_contributors_book_role')

  // Endorsements indexes
  await knex.schema.raw('DROP INDEX IF EXISTS idx_endorsements_fk_book')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_endorsements_by')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_endorsements_priority')

  // Imprints indexes
  await knex.schema.raw('DROP INDEX IF EXISTS idx_imprints_status')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_imprints_name')

  // Issues indexes
  await knex.schema.raw('DROP INDEX IF EXISTS idx_issues_fk_book')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_issues_resolved')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_issues_book_resolved')

  // Mentions indexes
  await knex.schema.raw('DROP INDEX IF EXISTS idx_mentions_fk_book')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_mentions_date')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_mentions_book_date')

  // Pricings indexes
  await knex.schema.raw('DROP INDEX IF EXISTS idx_pricings_fk_release')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_pricings_start_date')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_pricings_release_date')

  // Releases indexes
  await knex.schema.raw('DROP INDEX IF EXISTS idx_releases_fk_book')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_releases_status')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_releases_type')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_releases_publication_date')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_releases_book_status')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_releases_book_type')

  // Review quotes indexes
  await knex.schema.raw('DROP INDEX IF EXISTS idx_review_quotes_fk_book')

  // Signin history indexes
  await knex.schema.raw('DROP INDEX IF EXISTS idx_signin_history_fk_user')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_signin_history_datetime')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_signin_history_user_datetime')

  // Users indexes
  await knex.schema.raw('DROP INDEX IF EXISTS idx_users_status')
  await knex.schema.raw('DROP INDEX IF EXISTS idx_users_roles')
}
