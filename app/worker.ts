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
  // connect-src memuat SEMUA tier API: browser harus boleh menghubungi tier
  // cadangan saat circuit breaker pindah (app/infrastructure/api/failover.ts).
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https: blob:; media-src 'self' https: blob:; connect-src 'self' https://api.sambasku.com https://deno.sambasku.com https://render.sambasku.com https://sambasku-staging.iamutaki.com https://cloudflareinsights.com; frame-ancestors 'none'",
};

// ==== Edge cache HTML SSR (stale-while-revalidate) ====
// TTFB didominasi rantai Worker→API→DB. Halaman publik ('/' dan /words/<lemma>)
// aman di-cache di edge: sama untuk semua visitor, tanpa sesi login.
// - <FRESH_S     : hit langsung
// - FRESH_S..MAX : SAJIKAN versi lama, revalidasi di belakang layar
const FRESH_S = 60;
const STALE_MAX_S = 86400;

/// Sitemap jauh lebih mahal daripada satu halaman HTML (satu subrequest API per
/// halaman kata), dan isinya berubah lambat. Jendela segarnya sehari, bukan 60
/// detik, supaya crawler tidak memicu pembangunan ulang terus-menerus.
const SITEMAP_PATH = '/sitemap.xml';
const SITEMAP_FRESH_S = 86400;

function freshSeconds(pathname: string): number {
  return pathname === SITEMAP_PATH ? SITEMAP_FRESH_S : FRESH_S;
}

// @cloudflare/workers-types versi ini tidak mengetikkan caches.default
const edgeCache: Cache = (caches as unknown as { default: Cache }).default;

function isCacheable(method: string, pathname: string): boolean {
  // '/words' (daftar, ada filter query) sengaja tidak di-cache; hanya
  // halaman detail '/words/<lemma>', beranda, dan sitemap.
  return (
    method === 'GET' &&
    (pathname === '/' || pathname.startsWith('/words/') || pathname === SITEMAP_PATH)
  );
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

type EdgeEnv = { CF_VERSION_METADATA?: WorkerVersionMetadata };

/// HTML SSR memuat URL chunk ber-hash. Cache tanpa id deploy tetap
/// menyajikan HTML lama setelah wrangler deploy menghapus file itu (404).
function cacheKey(request: Request, versionId: string): Request {
  const url = new URL(request.url);
  url.searchParams.set('__build', versionId);
  return new Request(url.toString(), { method: 'GET' });
}

/// Yang disimpan di Cache API perlu TTL panjang supaya entry tidak dihapus.
/// Yang dikirim ke browser harus no-cache: kalau browser menyimpan HTML
/// sehari, deploy berikutnya membuat semua <script src="/assets/*"> 404.
function forBrowser(response: Response, cacheStatus: string): Response {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-cache');
  headers.delete('x-cached-at');
  headers.set('x-cache', cacheStatus);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function renderAndCache(
  request: Request,
  ctx: ExecutionContext,
  versionId: string,
): Promise<Response> {
  const response = await render(request);
  if (response.status === 200) {
    const headers = new Headers(response.headers);
    headers.set('x-cached-at', String(Date.now()));
    headers.set('Cache-Control', `public, max-age=${STALE_MAX_S}`);
    // PENTING: body stream cuma boleh dibaca SATU kali. clone() dulu untuk
    // cache - pakai response.body langsung membuat stream "disturbed" dan
    // response yang dikembalikan ke klien melempar error. put di waitUntil
    // supaya klien tidak menunggu penulisan cache.
    const forCache = new Response(response.clone().body, { status: 200, headers });
    ctx.waitUntil(edgeCache.put(cacheKey(request, versionId), forCache));
  }
  return response;
}

export default {
  async fetch(request, env: EdgeEnv, ctx): Promise<Response> {
    const { method } = request;
    const { pathname } = new URL(request.url);

    if (!isCacheable(method, pathname)) {
      return forBrowser(await render(request), 'bypass');
    }

    const versionId = env.CF_VERSION_METADATA?.id ?? 'dev';
    const key = cacheKey(request, versionId);
    const freshS = freshSeconds(pathname);
    const cached = await edgeCache.match(key);
    if (cached) {
      const ageS = (Date.now() - Number(cached.headers.get('x-cached-at') ?? 0)) / 1000;
      if (ageS >= STALE_MAX_S) {
        const response = await renderAndCache(request, ctx, versionId);
        return forBrowser(response, 'miss');
      }
      if (ageS > freshS) {
        ctx.waitUntil(renderAndCache(request, ctx, versionId));
      }
      return forBrowser(cached, ageS <= freshS ? 'hit' : 'swr');
    }

    const response = await renderAndCache(request, ctx, versionId);
    return forBrowser(response, 'miss');
  },
} satisfies ExportedHandler<EdgeEnv>;
