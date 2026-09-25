import { apiClient, type UnwrappedResult } from '@/infrastructure/api/api-client';
import type {
  TranslationHelpPublicDetail,
  TranslationHelpPublicItem,
} from '@/domain/entities/translation-help.entity';

export interface ListTranslationHelpsParams {
  limit?: number;
  cursor?: string;
  sort?: 'latest' | 'popular';
  signal?: AbortSignal;
}

export async function listPublishedTranslationHelps(
  params: ListTranslationHelpsParams = {},
): Promise<UnwrappedResult<TranslationHelpPublicItem[]>> {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.sort) query.set('sort', params.sort);

  const qs = query.toString();
  return apiClient<TranslationHelpPublicItem[]>(
    `/translation-helps${qs ? `?${qs}` : ''}`,
    { signal: params.signal },
  );
}

export async function getTranslationHelpDetail(
  id: string,
  signal?: AbortSignal,
): Promise<TranslationHelpPublicDetail> {
  const res = await apiClient<TranslationHelpPublicDetail>(
    `/translation-helps/${encodeURIComponent(id)}`,
    { signal },
  );
  return res.data;
}
