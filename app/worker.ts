import { createRequestHandler } from 'react-router';
import { env } from './infrastructure/config/env';
import { stripLocalePrefix } from './application/i18n/locales';

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
);

// ponytail: _headers hanya berlaku untuk aset statis - respons SSR (HTML,
// sitemap) lewat worker ini, jadi header keamanan diset di sini.
// Nilai identik dengan public/_headers.

/**
 * connect-src diturunkan dari tier API yang sama dengan circuit breaker
 * (env build-time), bukan daftar manual - pentest W-01: CSP produksi pernah
 * drift dan kehilangan host failover, mematikan failover di browser.
 * URL relative (/api/v1) = same-origin, sudah tercakup 'self'.
 */
const apiConnectOrigins = [
  ...new Set(
    [env.apiBaseUrl, ...env.apiBaseUrlFallbacks].flatMap((u) => {
      try {
        const parsed = new URL(u);
        return parsed.protocol === 'https:' ? [parsed.origin] : [];
      } catch {
        return [];
      }
    }),
  ),
];

/**
 * 'unsafe-eval' hanya untuk dev/staging (kebutuhan HMR); build produksi
 * tidak mengevaluasi kode dinamis (pentest W-02). 'unsafe-inline' masih
 * wajib: React Router menyuntikkan inline script hydration (nonce = backlog).
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${env.isProd ? '' : " 'unsafe-eval'"} https://static.cloudflareinsights.com`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  // Allowlist host gambar aktual (pentest W-09): jsDelivr = media repo
  // GitHub, wsrv.nl = proxy resize, ik.imagekit.io = kontribusi user.
  "img-src 'self' data: blob: https://ik.imagekit.io https://cdn.jsdelivr.net https://wsrv.nl",
  "media-src 'self' blob: https://cdn.jsdelivr.net",
  `connect-src 'self' ${apiConnectOrigins.join(' ')} https://cloudflareinsights.com`,
  "frame-ancestors 'none'",
].join('; ');

const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  // Pentest W-05: isolasi lintas origin (deep link sambasku:// + share).
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Content-Security-Policy': CSP,
};

// ==== Edge cache HTML SSR (stale-while-revalidate) ====
// TTFB didominasi rantai Worker→API→DB. Halaman publik ('/' dan /words/<lemma>)
// aman di-cache di edge: sama untuk semua visitor, tanpa sesi login.
// - <FRESH_S     : hit langsung
// - FRESH_S..MAX : SAJIKAN versi lama, revalidasi di belakang layar
const FRESH_S = 60;
const STALE_MAX_S = 86400;

/// Negative cache pendek untuk 404 halaman kata: tanpa ini /words/<random>
/// selalu memicu render SSR + subrequest API (pentest W-04).
const NEGATIVE_TTL_S = 60;

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
  // URL publik nyata berprefix /:locale (routes.ts) - '/words/…' polos hanyalah
  // redirect legacy yang tak pernah 200. Pengecekan memakai path TANPA prefix
  // locale (pentest B-02: selama ini cache tidak pernah menyala untuk
  // /id/words/…). HEAD ikut di-cache (pentest B-12): render HEAD dilakukan
  // sebagai GET sehingga entry berisi body penuh.
  // '/words' (daftar, ada filter query) dan '/search' sengaja tidak di-cache;
  // hanya halaman detail '/words/<lemma>', beranda per-locale, dan sitemap.
  const { path: bare } = stripLocalePrefix(pathname);
  return (
    (method === 'GET' || method === 'HEAD') &&
    (bare === '/' || bare.startsWith('/words/') || pathname === SITEMAP_PATH)
  );
}

async function render(request: Request): Promise<Response> {
  // HEAD dirender sebagai GET supaya body terisi penuh dan entry cache yang
  // dihasilkan valid untuk GET berikutnya (pentest B-12); body untuk klien
  // HEAD dibuang oleh forHead.
  const effective =
    request.method === 'HEAD'
      ? new Request(request.url, { method: 'GET', headers: request.headers })
      : request;
  const response = await requestHandler(effective);
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

/// HEAD tidak boleh membawa body (semantik HTTP); header - termasuk
/// Content-Length hasil render GET - tetap utuh (pentest B-12).
function forHead(request: Request, response: Response): Response {
  if (request.method !== 'HEAD') return response;
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

/// HTML SSR memuat URL chunk ber-hash. Cache tanpa id deploy tetap
/// menyajikan HTML lama setelah wrangler deploy menghapus file itu (404).
///
/// Key dinormalisasi ke origin+pathname LENGKAP (prefix locale dipertahankan:
/// /id/words/x dan /id-SBS/words/x kontennya beda bahasa - tidak boleh
/// berbagi entry) dan query string masukan DIABUANG: halaman cacheable tidak
/// bergantung query, dan tanpa normalisasi tiap URL unik membuat entry cache
/// baru = cache flooding (pentest W-03/B-03).
function cacheKey(request: Request, versionId: string): Request {
  const url = new URL(request.url);
  return new Request(`${url.origin}${url.pathname}?__build=${versionId}`, { method: 'GET' });
}

/// Yang disimpan di Cache API perlu TTL panjang supaya entry tidak dihapus.
/// Yang dikirim ke browser harus no-cache: kalau browser menyimpan HTML
/// sehari, deploy berikutnya membuat semua <script src="/assets/*"> 404.
function forBrowser(response: Response, cacheStatus: string): Response {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-cache');
  // Header internal entry cache tidak boleh bocor ke klien (pentest W-08).
  headers.delete('x-cached-at');
  headers.delete('x-cache-ttl');
  headers.set('x-cache', cacheStatus);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** TTL entry cache menurut status respons; 0 = jangan di-cache. */
function cacheTtlS(pathname: string, status: number): number {
  if (status === 200) return STALE_MAX_S;
  if (status === 404 && pathname.startsWith('/words/')) return NEGATIVE_TTL_S;
  return 0;
}

async function renderAndCache(
  request: Request,
  ctx: ExecutionContext,
  versionId: string,
): Promise<Response> {
  const response = await render(request);
  const ttlS = cacheTtlS(new URL(request.url).pathname, response.status);
  if (ttlS > 0) {
    const headers = new Headers(response.headers);
    headers.set('x-cached-at', String(Date.now()));
    headers.set('x-cache-ttl', String(ttlS));
    headers.set('Cache-Control', `public, max-age=${ttlS}`);
    // PENTING: body stream cuma boleh dibaca SATU kali. clone() dulu untuk
    // cache - pakai response.body langsung membuat stream "disturbed" dan
    // response yang dikembalikan ke klien melempar error. put di waitUntil
    // supaya klien tidak menunggu penulisan cache.
    const forCache = new Response(response.clone().body, { status: response.status, headers });
    ctx.waitUntil(edgeCache.put(cacheKey(request, versionId), forCache));
  }
  return response;
}

export default {
  async fetch(request, env: EdgeEnv, ctx): Promise<Response> {
    const { method } = request;
    const url = new URL(request.url);
    const { pathname } = url;

    // www hanya Custom Domain alias; apex kanonikal (pentest W-11).
    if (url.hostname === 'www.sambasku.com') {
      url.hostname = 'sambasku.com';
      return Response.redirect(url.toString(), 301);
    }

    if (!isCacheable(method, pathname)) {
      return forHead(request, forBrowser(await render(request), 'bypass'));
    }

    const versionId = env.CF_VERSION_METADATA?.id ?? 'dev';
    const key = cacheKey(request, versionId);
    const cached = await edgeCache.match(key);
    if (cached) {
      const ttlS = Number(cached.headers.get('x-cache-ttl') ?? STALE_MAX_S);
      const ageS = (Date.now() - Number(cached.headers.get('x-cached-at') ?? 0)) / 1000;
      if (ageS >= ttlS) {
        const response = await renderAndCache(request, ctx, versionId);
        return forHead(request, forBrowser(response, 'miss'));
      }
      const freshS = Math.min(freshSeconds(pathname), ttlS);
      if (ageS > freshS) {
        ctx.waitUntil(renderAndCache(request, ctx, versionId));
      }
      return forHead(request, forBrowser(cached, ageS <= freshS ? 'hit' : 'swr'));
    }

    const response = await renderAndCache(request, ctx, versionId);
    return forHead(request, forBrowser(response, 'miss'));
  },
} satisfies ExportedHandler<EdgeEnv>;
