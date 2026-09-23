import { createRequestHandler } from 'react-router';
import { env } from './infrastructure/config/env';

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
);

// ponytail: _headers hanya berlaku untuk aset statis - respons SSR (HTML,
// sitemap) lewat worker ini, jadi header keamanan diset di sini.
// Nilai identik dengan public/_headers.
const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https: blob:; media-src 'self' https: blob:; connect-src 'self' https://sambasku.iamutaki.com https://sambasku-staging.iamutaki.com; frame-ancestors 'none'",
};

// ==== Edge cache HTML SSR (stale-while-revalidate) ====
// TTFB didominasi rantai Worker→API→DB. Halaman publik ('/' dan /words/<lemma>)
// aman di-cache di edge: sama untuk semua visitor, tanpa sesi login.
// - <FRESH_S     : hit langsung
// - FRESH_S..MAX : SAJIKAN versi lama, revalidasi di belakang layar
const FRESH_S = 60;
const STALE_MAX_S = 86400;

// @cloudflare/workers-types versi ini tidak mengetikkan caches.default
const edgeCache: Cache = (caches as unknown as { default: Cache }).default;

function isCacheable(method: string, pathname: string): boolean {
  // '/words' (daftar, ada filter query) sengaja tidak di-cache; hanya
  // halaman detail '/words/<lemma>' dan beranda.
  return method === 'GET' && (pathname === '/' || pathname.startsWith('/words/'));
}

async function render(request: Request): Promise<Response> {
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
}

async function renderAndCache(request: Request, ctx: ExecutionContext): Promise<Response> {
  const response = await render(request);
  if (response.status === 200) {
    // Tandai waktu simpan; TTL panjang agar entry tidak dihapus cache API,
    // keseguran dicek manual dari header saat match.
    const headers = new Headers(response.headers);
    headers.set('x-cached-at', String(Date.now()));
    headers.set('Cache-Control', `public, max-age=${STALE_MAX_S}`);
    // PENTING: body stream cuma boleh dibaca SATU kali. clone() dulu untuk
    // cache - pakai response.body langsung membuat stream "disturbed" dan
    // response yang dikembalikan ke klien melempar error. put di waitUntil
    // supaya klien tidak menunggu penulisan cache.
    const forCache = new Response(response.clone().body, { status: 200, headers });
    ctx.waitUntil(edgeCache.put(request, forCache));
  }
  return response;
}

export default {
  async fetch(request, _env, ctx): Promise<Response> {
    const { method } = request;
    const { pathname } = new URL(request.url);

    if (!isCacheable(method, pathname)) {
      return render(request);
    }

    const cached = await edgeCache.match(request);
    if (cached) {
      const ageS = (Date.now() - Number(cached.headers.get('x-cached-at') ?? 0)) / 1000;
      if (ageS > FRESH_S && ageS < STALE_MAX_S) {
        ctx.waitUntil(renderAndCache(request, ctx));
      }
      const headers = new Headers(cached.headers);
      headers.set('x-cache', ageS <= FRESH_S ? 'hit' : 'swr');
      return new Response(cached.body, { status: cached.status, headers });
    }

    const response = await renderAndCache(request, ctx);
    const headers = new Headers(response.headers);
    headers.set('x-cache', 'miss');
    return new Response(response.body, { status: response.status, headers });
  },
} satisfies ExportedHandler;
