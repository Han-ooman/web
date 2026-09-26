import { apiClient } from '@/infrastructure/api/api-client';

export const STOCK_PHOTO_PROVIDERS = [
  'pixabay',
  'openverse',
  'unsplash',
] as const;

export type StockPhotoProvider = (typeof STOCK_PHOTO_PROVIDERS)[number];

export const STOCK_PROVIDER_LABELS: Record<StockPhotoProvider, string> = {
  pixabay: 'Pixabay',
  openverse: 'Openverse',
  unsplash: 'Unsplash',
};

export interface ShareBackgroundItem {
  id: string;
  url: string;
  preview_url: string;
  photographer: string;
  username: string;
  attribution_url: string;
  provider: StockPhotoProvider;
  kind: 'photo' | 'video';
  width: number;
  height: number;
}

export interface ListShareBackgroundsResult {
  provider: string;
  page: number;
  degraded: boolean;
  items: ShareBackgroundItem[];
}

type ShareBackgroundsData = {
  provider: string;
  page: number;
  degraded: boolean;
  media: string;
  items: ShareBackgroundItem[];
};

/**
 * Proxy GET /share/backgrounds (publik). Hanya foto;
 * video dibuang di client.
 */
export async function listShareBackgrounds(params: {
  q?: string;
  page?: number;
  sort?: 'relevant' | 'popular';
  provider?: StockPhotoProvider;
  limit?: number;
  signal?: AbortSignal;
}): Promise<ListShareBackgroundsResult> {
  const sort = params.sort ?? (params.q?.trim() ? 'relevant' : 'popular');
  const query = new URLSearchParams();
  if (params.q?.trim()) query.set('q', params.q.trim());
  query.set('page', String(params.page ?? 1));
  query.set('sort', sort);
  query.set('provider', params.provider ?? 'pixabay');
  query.set('limit', String(params.limit ?? 12));
  query.set('media', 'photo');

  const { data } = await apiClient<ShareBackgroundsData>(
    `/share/backgrounds?${query.toString()}`,
    { signal: params.signal },
  );

  return {
    provider: data.provider,
    page: data.page,
    degraded: data.degraded,
    items: (data.items ?? []).filter((i) => i.kind !== 'video'),
  };
}
