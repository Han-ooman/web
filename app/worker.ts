import { createRequestHandler } from 'react-router';
import { env } from './infrastructure/config/env';

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
);

// ponytail: _headers hanya berlaku untuk aset statis — respons SSR (HTML,
// sitemap) lewat worker ini, jadi header keamanan diset di sini.
// Nilai identik dengan public/_headers.
const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; media-src 'self' https: blob:; connect-src 'self' https://sambasku.iamutaki.com https://sambasku-staging.iamutaki.com; frame-ancestors 'none'",
};

export default {
  async fetch(request: Request): Promise<Response> {
    const response = await requestHandler(request);
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      headers.set(key, value);
    }
    // Staging tidak boleh terlisting di search engine.
    if (!env.isProd) {
      headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
} satisfies ExportedHandler;
