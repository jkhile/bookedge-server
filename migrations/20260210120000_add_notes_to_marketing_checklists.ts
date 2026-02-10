import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('marketing_checklists', (table) => {
    table.text('notes_discussed_with_author').defaultTo('')
    table.text('notes_discussed_sent_samples').defaultTo('')
    table.text('notes_discussed_calculated').defaultTo('')
    table.text('notes_created').defaultTo('')
    table.text('notes_created_continued').defaultTo('')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('marketing_checklists', (table) => {
    table.dropColumn('notes_discussed_with_author')
    table.dropColumn('notes_discussed_sent_samples')
    table.dropColumn('notes_discussed_calculated')
    table.dropColumn('notes_created')
    table.dropColumn('notes_created_continued')
  })
}
