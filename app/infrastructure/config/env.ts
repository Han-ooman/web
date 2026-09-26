const DEFAULT_API_BASE_URL = typeof window === 'undefined'
  ? 'https://sambasku-staging.iamutaki.com/api/v1'
  : '/api/v1';

const DEFAULT_APP_URL = typeof window === 'undefined'
  ? 'https://sambasku.com'
  : (typeof window !== 'undefined' ? window.location.origin : 'https://sambasku.com');

const DEFAULT_APP_NAME = 'Kamus Digital Sambas-Indonesia';

const mode = (typeof import.meta !== 'undefined' && import.meta.env?.MODE) || 'development';

// Pentest W-12: tanpa guard ini, build produksi yang lupa VITE_API_BASE_URL
// membuat SSR diam-diam memakai API staging. Gagal keras di awal lebih baik
// daripada data lintas environment senyap.
if (
  mode === 'production' &&
  typeof window === 'undefined' &&
  !(typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
) {
  throw new Error('VITE_API_BASE_URL wajib di-set untuk SSR produksi');
}

/**
 * Tier cadangan API, urut, dari `VITE_API_BASE_URL_FALLBACKS` (dipisah koma).
 * Kosong = circuit breaker tidak punya tujuan pindah dan diam.
 * Lihat `app/infrastructure/api/failover.ts` dan docs/backlogs/FAILOVER.md.
 */
const apiBaseUrlFallbacks: readonly string[] = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL_FALLBACKS) || ''
)
  .split(',')
  .map((u: string) => u.trim())
  .filter((u: string) => u !== '');

export const env = {
  apiBaseUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || DEFAULT_API_BASE_URL,
  apiBaseUrlFallbacks,
  appUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL) || DEFAULT_APP_URL,
  appName: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_NAME) || DEFAULT_APP_NAME,
  mode,
  /**
   * SEO (sitemap, JSON-LD, index) HANYA aktif di build produksi.
   * Staging/dev noindex total supaya tidak terlisting di search engine.
   */
  isProd: mode === 'production',
} as const;
