import type { UsageLabel } from '@/domain/usage-labels';

export type WordType = 'word' | 'idiom' | 'peribahasa' | 'ungkapan';
export type WordStatus = 'draft' | 'pending' | 'published' | 'rejected';
export type { UsageLabel };

export interface WordSummary {
  id: string;
  lemma: string;
  language_id: string;
  language_code: string;
  word_type: WordType;
  usage_labels?: UsageLabel[];
  status: WordStatus;
  is_verified: boolean;
  matched_translation?: string | null;
  /** ISO dari GET /words. Sitemap memakai ini sebagai lastmod. */
  updated_at?: string | null;
}

export interface WordClass {
  id: string;
  code: string;
  name: string;
  alias: string | null;
  description: string | null;
  parent_id: string | null;
}

export interface WordTranslation {
  language_id: string;
  translation_text: string;
  translation_type: string;
}

export interface WordAudio {
  id: string;
  url: string;
  dialect_id: string | null;
  speaker_name: string | null;
  duration_ms: number | null;
  is_primary: boolean;
  mime_type: string;
}

export interface WordExample {
  id: string;
  source_language_id: string;
  source_sentence: string;
  target_language_id: string | null;
  target_sentence: string | null;
  source_type: string | null;
  audios: WordAudio[];
}

export interface WordMeaning {
  id: string;
  word_class: WordClass | null;
  inherited_from_meaning_id?: string | null;
  definition: string;
  is_have_definition: boolean;
  is_have_translation: boolean;
  order_index: number;
  translations: WordTranslation[];
  examples: WordExample[];
}

export interface WordPronunciation {
  id: string;
  notation: string;
  value: string;
  dialect_id: string | null;
}

export interface WordImage {
  id: string;
  url: string;
  provider_file_id: string;
  alt_text: string | null;
  is_primary: boolean;
  content_warnings?: string[];
  is_verified?: boolean;
}

export interface RelatedWord {
  word_id: string;
  lemma: string;
  relation_type: string;
}

export interface WordVariant {
  id: string;
  form: string;
  variant_type: string;
  affix_type?: string | null;
  affix_value?: string | null;
  dialect_id?: string | null;
  notes?: string | null;
}

export interface WordDetail {
  id: string;
  lemma: string;
  language_id: string;
  notes: string | null;
  word_type: WordType;
  usage_labels: UsageLabel[];
  status: WordStatus;
  is_verified: boolean;
  is_corrected: boolean;
  self_verified?: boolean;
  created_by?: {
    username: string;
    role: string;
  } | null;
  verified_by?: {
    username: string;
    role: string;
  } | null;
  verified_at?: string | null;
  meanings: WordMeaning[];
  categories: Array<{ id: string; name: string }>;
  pronunciations: WordPronunciation[];
  audios: WordAudio[];
  images: WordImage[];
  related_words: RelatedWord[];
  appears_in?: RelatedWord[];
  variants: WordVariant[];
}

export interface WordOfTheDay {
  word: WordDetail | null;
  date: string;
  is_new_this_week: boolean;
}
