const DEFAULT_API_BASE_URL = typeof window === 'undefined'
  ? 'https://sambasku-staging.iamutaki.com/api/v1'
  : '/api/v1';

const DEFAULT_APP_URL = typeof window === 'undefined'
  ? 'https://sambasku.iamutaki.com'
  : (typeof window !== 'undefined' ? window.location.origin : 'https://sambasku.iamutaki.com');

const DEFAULT_APP_NAME = 'Kamus Digital Sambas-Indonesia';

const mode = (typeof import.meta !== 'undefined' && import.meta.env?.MODE) || 'development';

export const env = {
  apiBaseUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || DEFAULT_API_BASE_URL,
  appUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL) || DEFAULT_APP_URL,
  appName: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_NAME) || DEFAULT_APP_NAME,
  mode,
  /**
   * SEO (sitemap, JSON-LD, index) HANYA aktif di build produksi.
   * Staging/dev noindex total supaya tidak terlisting di search engine.
   */
  isProd: mode === 'production',
} as const;
