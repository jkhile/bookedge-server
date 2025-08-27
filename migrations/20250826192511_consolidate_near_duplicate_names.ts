import type { Knex } from 'knex'

// Near-duplicate contributor groups to consolidate
const consolidationGroups = [
  {
    preferred: 'Alper, Robert A.',
    merge_from: ['Alper, Robert'],
  },
  {
    preferred: 'Buttry, Daniel L.',
    merge_from: ['Buttry, Dan L.', 'Buttry, Daniel', 'Buttry, Daniel L'],
  },
  {
    preferred: 'Crumm, David M.',
    merge_from: ['Crumm, David'],
  },
  {
    preferred: 'Gushee, David P.',
    merge_from: ['Gushee, David', 'Gushee, David P', 'Gushee, David, P.'],
  },
  {
    preferred: 'Gutleben, Christine',
    merge_from: ['Gutelben, Christine'],
  },
  {
    preferred: 'Harnish, John E.',
    merge_from: ['Harnish, John, E.', 'Harnish, Rev. Dr. John E. (Jack)'],
  },
  {
    preferred: 'Krakoff, Joseph H.',
    merge_from: ['Krakoff, Rabbi Joseph H.'],
  },
  {
    preferred: 'Lemasters, Craig',
    merge_from: ['Lemasters, Mr. Craig'],
  },
  {
    preferred: 'McLaren, Brian D.',
    merge_from: ['McLaren, Brian', 'McLaren, Brian D'],
  },
  {
    preferred: 'Michigan State School of Journalism',
    merge_from: ['Michigan State University School of Journalism'],
  },
  {
    preferred: 'Pasick, Robert',
    merge_from: ['Pasick, Dr. Rob'],
  },
  {
    preferred: 'Sider, Michelle Y.',
    merge_from: ['Sider, Dr. Michelle Y.'],
  },
  {
    preferred: 'Wallace, Peter M.',
    merge_from: ['Wallace, Peter'],
  },
  {
    preferred: 'Worthy, Clifford',
    merge_from: ['Worthy, Cliff'],
  },
]

export async function up(knex: Knex): Promise<void> {
  // Process each consolidation group
  for (const group of consolidationGroups) {
    // Get the preferred contributor ID
    const preferredContributor = await knex('contributors')
      .where('published_name', group.preferred)
      .first()

    if (!preferredContributor) {
      console.warn(
        `Warning: Preferred contributor not found: ${group.preferred}`,
      )
      continue
    }

    const preferredId = preferredContributor.id

    // Process each name to be merged
    for (const nameToMerge of group.merge_from) {
      // Get the contributor to be merged
      const contributorToMerge = await knex('contributors')
        .where('published_name', nameToMerge)
        .first()

      if (!contributorToMerge) {
        console.warn(`Warning: Contributor not found to merge: ${nameToMerge}`)
        continue
      }

      const mergeId = contributorToMerge.id

      // Skip if trying to merge a contributor with itself
      if (mergeId === preferredId) {
        console.warn(
          `Warning: Skipping self-merge for contributor ${nameToMerge} (ID: ${mergeId})`,
        )
        continue
      }

      // Get all "book-contributor-roles" records for the contributor to be merged
      const bookContributorRecords = await knex('book-contributor-roles')
        .where('fk_contributor', mergeId)
        .select('fk_book', 'contributor_role')

      // Update or handle each "book-contributor-roles" record
      for (const record of bookContributorRecords) {
        // Check if a record already exists for this book-contributor-role combination
        const existingRecord = await knex('book-contributor-roles')
          .where({
            fk_book: record.fk_book,
            fk_contributor: preferredId,
            contributor_role: record.contributor_role,
          })
          .first()

        if (existingRecord) {
          // If the exact combination already exists, just delete the duplicate
          await knex('book-contributor-roles')
            .where({
              fk_book: record.fk_book,
              fk_contributor: mergeId,
              contributor_role: record.contributor_role,
            })
            .delete()
        } else {
          // Update the record to point to the preferred contributor
          await knex('book-contributor-roles')
            .where({
              fk_book: record.fk_book,
              fk_contributor: mergeId,
              contributor_role: record.contributor_role,
            })
            .update({
              fk_contributor: preferredId,
              updated_at: knex.fn.now(),
            })
        }
      }

      // Delete the merged contributor record
      await knex('contributors').where('id', mergeId).delete()

      console.log(
        `Merged contributor "${nameToMerge}" (ID: ${mergeId}) into "${group.preferred}" (ID: ${preferredId})`,
      )
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function down(knex: Knex): Promise<void> {
  // This migration cannot be safely reversed as it involves data consolidation
  // and deletion of records. The original contributor records and their exact
  // book associations cannot be restored without backup data.
  console.warn(
    'This migration cannot be reversed. Original contributor records have been deleted.',
  )
}
