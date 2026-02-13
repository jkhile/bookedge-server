// Tests for MarketingChecklist schema validation
import { describe, it, expect } from 'vitest'
import {
  marketingChecklistDataValidator,
  marketingChecklistPatchValidator,
  marketingChecklistQueryValidator,
  marketingChecklistSchema,
  marketingChecklistDataSchema,
  marketingChecklistPatchSchema,
} from '../../../src/services/marketing-checklists/marketing-checklists.schema'

// Helper to build a complete valid data object for create operations
const buildValidData = (overrides: Record<string, unknown> = {}) => ({
  book_id: 1,
  fep_marketing_tips: '',
  author_website: '',
  author_social_media: '',
  unique_email: '',
  domain_name: '',
  author_photos: '',
  media_kit_sample: '',
  postcards_sample: '',
  tabletop_banners_sample: '',
  floor_banners_sample: '',
  bookplates_sample: '',
  cover_reveals_sample: '',
  book_opening_videos_sample: '',
  book_trailers_sample: '',
  amazon_author_page: '',
  bookmarks_sample: '',
  book_pricing: '',
  book_pricing_email: '',
  media_kit_created: '',
  media_kit_dmitri_checked: '',
  media_kit_uploaded: '',
  media_kit_sent_to_printer: '',
  media_outreach_list: '',
  cover_reveal_created: '',
  cover_reveal_youtube: '',
  book_opening_video_created: '',
  book_opening_video_youtube: '',
  book_trailer_created: '',
  book_trailer_dmitri_checked: '',
  book_trailer_youtube: '',
  a_plus_marketing: '',
  a_plus_sent_to_dmitri: '',
  press_release: '',
  specialty_postcards: '',
  specialty_tabletop_banners: '',
  specialty_floor_banners: '',
  specialty_bookplates: '',
  order_promo_copies: '',
  cover_art_font: '',
  cover_art_colors: '',
  hashtags: '',
  notes_discussed_with_author: '',
  notes_discussed_sent_samples: '',
  notes_discussed_calculated: '',
  notes_created: '',
  notes_created_continued: '',
  ...overrides,
})

describe('MarketingChecklist schema definitions', () => {
  describe('main schema structure', () => {
    it('should have the correct $id', () => {
      expect(marketingChecklistSchema.$id).toBe('MarketingChecklist')
    })

    it('should disallow additional properties', () => {
      expect(marketingChecklistSchema.additionalProperties).toBe(false)
    })

    it('should define id as integer', () => {
      expect(marketingChecklistSchema.properties.id.type).toBe('integer')
    })

    it('should define book_id as integer', () => {
      expect(marketingChecklistSchema.properties.book_id.type).toBe('integer')
    })

    it('should define checklist date fields as string', () => {
      const dateFields = [
        'fep_marketing_tips',
        'author_website',
        'author_social_media',
        'media_kit_sample',
        'book_pricing',
        'media_kit_created',
        'cover_reveal_created',
        'book_trailer_created',
        'a_plus_marketing',
        'press_release',
        'order_promo_copies',
      ]
      for (const field of dateFields) {
        expect(
          marketingChecklistSchema.properties[field].type,
          `${field} should be string`,
        ).toBe('string')
      }
    })

    it('should define notes fields as string', () => {
      const notesFields = [
        'notes_discussed_with_author',
        'notes_discussed_sent_samples',
        'notes_discussed_calculated',
        'notes_created',
        'notes_created_continued',
      ]
      for (const field of notesFields) {
        expect(
          marketingChecklistSchema.properties[field].type,
          `${field} should be string`,
        ).toBe('string')
      }
    })

    it('should define text fields as string', () => {
      const textFields = ['cover_art_font', 'cover_art_colors', 'hashtags']
      for (const field of textFields) {
        expect(
          marketingChecklistSchema.properties[field].type,
          `${field} should be string`,
        ).toBe('string')
      }
    })

    it('should define audit fields as optional', () => {
      // Audit fields should not be in the required array
      const required = marketingChecklistSchema.required || []
      expect(required).not.toContain('fk_created_by')
      expect(required).not.toContain('created_at')
      expect(required).not.toContain('fk_updated_by')
      expect(required).not.toContain('updated_at')
    })
  })

  describe('data schema (create)', () => {
    it('should have the correct $id', () => {
      expect(marketingChecklistDataSchema.$id).toBe('MarketingChecklistData')
    })

    it('should exclude id and audit fields from create schema', () => {
      const props = Object.keys(marketingChecklistDataSchema.properties)
      expect(props).not.toContain('id')
      expect(props).not.toContain('fk_created_by')
      expect(props).not.toContain('created_at')
      expect(props).not.toContain('fk_updated_by')
      expect(props).not.toContain('updated_at')
    })

    it('should include book_id in create schema', () => {
      const props = Object.keys(marketingChecklistDataSchema.properties)
      expect(props).toContain('book_id')
    })
  })

  describe('patch schema', () => {
    it('should have the correct $id', () => {
      expect(marketingChecklistPatchSchema.$id).toBe('MarketingChecklistPatch')
    })

    it('should make all fields optional for patching', () => {
      // Patch schema should have no required fields
      expect(marketingChecklistPatchSchema.required).toBeUndefined()
    })
  })
})

describe('MarketingChecklist data validator', () => {
  it('should accept valid complete data', async () => {
    const data = buildValidData()
    await expect(marketingChecklistDataValidator(data)).resolves.not.toThrow()
  })

  it('should accept data with date strings in checklist fields', async () => {
    const data = buildValidData({
      fep_marketing_tips: '2026-01-15',
      author_website: '2026-02-01',
      media_kit_created: '2026-03-10',
    })
    await expect(marketingChecklistDataValidator(data)).resolves.not.toThrow()
  })

  it('should accept data with content in notes fields', async () => {
    const data = buildValidData({
      notes_discussed_with_author: 'Author prefers social media focus',
      notes_created: 'Media kit needs revision',
      hashtags: '#newbook #fiction #2026',
    })
    await expect(marketingChecklistDataValidator(data)).resolves.not.toThrow()
  })

  it('should reject data missing book_id', async () => {
    const data = buildValidData()
    delete (data as Record<string, unknown>).book_id
    await expect(marketingChecklistDataValidator(data)).rejects.toThrow(
      'validation failed',
    )
  })

  it('should reject data with non-integer book_id', async () => {
    const data = buildValidData({ book_id: 'not-a-number' })
    await expect(marketingChecklistDataValidator(data)).rejects.toThrow(
      'validation failed',
    )
  })

  it('should reject data with non-string checklist field', async () => {
    const data = buildValidData({ fep_marketing_tips: 123 })
    await expect(marketingChecklistDataValidator(data)).rejects.toThrow(
      'validation failed',
    )
  })

  it('should reject data with additional properties', async () => {
    const data = buildValidData({ unknown_field: 'value' })
    await expect(marketingChecklistDataValidator(data)).rejects.toThrow(
      'validation failed',
    )
  })
})

describe('MarketingChecklist patch validator', () => {
  it('should accept a partial update with single field', async () => {
    await expect(
      marketingChecklistPatchValidator({
        fep_marketing_tips: '2026-01-15',
      }),
    ).resolves.not.toThrow()
  })

  it('should accept an empty object', async () => {
    await expect(marketingChecklistPatchValidator({})).resolves.not.toThrow()
  })

  it('should accept patching multiple checklist fields', async () => {
    await expect(
      marketingChecklistPatchValidator({
        media_kit_created: '2026-03-10',
        media_kit_dmitri_checked: '2026-03-11',
        media_kit_uploaded: '2026-03-12',
      }),
    ).resolves.not.toThrow()
  })

  it('should accept patching notes fields', async () => {
    await expect(
      marketingChecklistPatchValidator({
        notes_discussed_with_author: 'Updated notes',
        cover_art_font: 'Garamond',
        cover_art_colors: 'Navy, Gold',
      }),
    ).resolves.not.toThrow()
  })

  it('should reject patch with non-string checklist field', async () => {
    await expect(
      marketingChecklistPatchValidator({
        author_website: 123,
      }),
    ).rejects.toThrow('validation failed')
  })

  it('should reject patch with additional properties', async () => {
    await expect(
      marketingChecklistPatchValidator({
        unknown_field: 'value',
      }),
    ).rejects.toThrow('validation failed')
  })
})

describe('MarketingChecklist query validator', () => {
  it('should accept an empty query', async () => {
    await expect(marketingChecklistQueryValidator({})).resolves.not.toThrow()
  })

  it('should accept query by book_id', async () => {
    await expect(
      marketingChecklistQueryValidator({ book_id: 1 }),
    ).resolves.not.toThrow()
  })

  it('should accept query by id', async () => {
    await expect(
      marketingChecklistQueryValidator({ id: 5 }),
    ).resolves.not.toThrow()
  })

  it('should accept query with $limit and $skip', async () => {
    await expect(
      marketingChecklistQueryValidator({
        $limit: 10,
        $skip: 0,
      }),
    ).resolves.not.toThrow()
  })

  it('should accept query with $select', async () => {
    await expect(
      marketingChecklistQueryValidator({
        $select: ['id', 'book_id', 'fep_marketing_tips'],
      }),
    ).resolves.not.toThrow()
  })

  it('should reject query with additional properties', async () => {
    await expect(
      marketingChecklistQueryValidator({
        nonexistent_field: 'value',
      }),
    ).rejects.toThrow('validation failed')
  })
})
