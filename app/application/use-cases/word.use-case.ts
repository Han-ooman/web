import { apiClient, type UnwrappedResult } from '@/infrastructure/api/api-client';
import type { WordDetail, WordSummary, WordOfTheDay } from '@/domain/entities/word.entity';

export interface SearchWordsParams {
  q: string;
  limit?: number;
  cursor?: string;
  searchIn?: 'lemma' | 'translation';
  wordType?: string;
  signal?: AbortSignal;
}

export interface ListWordsParams {
  q?: string;
  /** Satu huruf A-Z: prefix lemma (panel beranda). Beda dari q = contains. */
  letter?: string;
  limit?: number;
  cursor?: string;
  wordType?: string;
  signal?: AbortSignal;
}

export async function searchWords(
  params: SearchWordsParams,
): Promise<UnwrappedResult<WordSummary[]>> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.searchIn) query.set('search_in', params.searchIn);
  if (params.wordType) query.set('word_type', params.wordType);

  return apiClient<WordSummary[]>(`/words/search?${query.toString()}`, {
    signal: params.signal,
  });
}

export async function listWordsAtoZ(
  params: ListWordsParams = {},
): Promise<UnwrappedResult<WordSummary[]>> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.letter) query.set('letter', params.letter);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.wordType) query.set('word_type', params.wordType);

  return apiClient<WordSummary[]>(`/words?${query.toString()}`, {
    signal: params.signal,
  });
}

/** Item feed GET /words/latest (urut waktu persetujuan). */
export interface LatestWord {
  id: string;
  lemma: string;
  word_type: 'word' | 'idiom' | 'peribahasa' | 'ungkapan';
  approved_at: string;
  sense: string | null;
}

export async function listLatestWords(
  params: { limit?: number; cursor?: string; signal?: AbortSignal } = {},
): Promise<UnwrappedResult<LatestWord[]>> {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  if (params.cursor) query.set('cursor', params.cursor);

  return apiClient<LatestWord[]>(`/words/latest?${query.toString()}`, {
    signal: params.signal,
  });
}

export async function getWordOfDay(signal?: AbortSignal): Promise<WordOfTheDay> {
  try {
    const res = await apiClient<WordDetail & { date: string; is_new_this_week: boolean }>(
      '/words/today',
      { signal },
    );
    if (!res.data) {
      return {
        word: null,
        date: new Date().toISOString().split('T')[0],
        is_new_this_week: false,
      };
    }
    const { date, is_new_this_week, ...word } = res.data;
    return {
      word: word as WordDetail,
      date: date ?? new Date().toISOString().split('T')[0],
      is_new_this_week: Boolean(is_new_this_week),
    };
  } catch {
    return {
      word: null,
      date: new Date().toISOString().split('T')[0],
      is_new_this_week: false,
    };
  }
}

export async function getWordDetail(id: string, signal?: AbortSignal): Promise<WordDetail> {
  const res = await apiClient<WordDetail>(`/words/${encodeURIComponent(id)}`, { signal });
  return res.data;
}

export async function getWordByLemma(lemma: string, signal?: AbortSignal): Promise<WordDetail> {
  const res = await apiClient<WordDetail>(`/words/lemma/${encodeURIComponent(lemma)}`, {
    signal,
  });
  return res.data;
}

export interface KbbiSuggestion {
  id: string;
  lemma: string;
  word_class_code: string | null;
  word_class_label: string | null;
  definition: string;
  preview: string;
}

/** Lookup definisi KBBI (publik) untuk prefill form kontribusi. */
export async function lookupKbbi(
  lemma: string,
  signal?: AbortSignal,
): Promise<KbbiSuggestion[]> {
  const res = await apiClient<{ found: boolean; suggestions: KbbiSuggestion[] }>(
    `/lemma-definitions/lookup?lemma=${encodeURIComponent(lemma)}`,
    { signal },
  );
  return res.data.suggestions;
}
