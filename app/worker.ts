import { createRequestHandler } from 'react-router';
import { env } from './infrastructure/config/env';
import {
  STALE_MAX_S,
  cacheKeyRequest,
  cacheTtlSeconds,
  freshSeconds,
  isCacheableRequest,
} from './edge/cache-policy';
import {
  apiConnectOriginsFrom,
  buildSecurityHeaders,
} from './edge/security-headers';
import { isOgImagePath } from './edge/cache-policy';

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
);

const SECURITY_HEADERS = buildSecurityHeaders({
  apiConnectOrigins: apiConnectOriginsFrom([
    env.apiBaseUrl,
    ...env.apiBaseUrlFallbacks,
  ]),
  isProd: env.isProd,
});

// ponytail: _headers hanya berlaku untuk aset statis - respons SSR (HTML,
// sitemap) lewat worker ini, jadi header keamanan diset di sini.
// Nilai diturunkan dari modul yang sama dengan public/_headers (lihat
// app/edge/security-headers.ts + plugin generate-headers-file di
// vite.config.ts) supaya tidak ada dua daftar CSP yang bisa drift (BH-06).

// @cloudflare/workers-types versi ini tidak mengetikkan caches.default
const edgeCache: Cache = (caches as unknown as { default: Cache }).default;

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
  // Kartu OG difetch crawler/unfurler lintas origin; CORP same-origin
  // menghalangi sebagian proxy unfurl. Crawler umumnya mengabaikan CORP,
  // tapi longgarkan khusus path ini supaya share card aman di semua klien.
  if (isOgImagePath(new URL(request.url).pathname)) {
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
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

async function renderAndCache(
  request: Request,
  ctx: ExecutionContext,
  versionId: string,
): Promise<Response> {
  const response = await render(request);
  const ttlS = cacheTtlSeconds(new URL(request.url).pathname, response.status);
  if (ttlS > 0) {
    const headers = new Headers(response.headers);
    // Cache API menolak menyimpan respons ber-Set-Cookie: put() jadi no-op
    // diam-diam sehingga edge cache HTML mati total (pentest G-01). Entry
    // cache memang harus bebas state per-user; cookie tetap sampai ke browser
    // lewat `response` yang dikembalikan.
    headers.delete('Set-Cookie');
    headers.set('x-cached-at', String(Date.now()));
    headers.set('x-cache-ttl', String(ttlS));
    headers.set('Cache-Control', `public, max-age=${ttlS}`);
    // PENTING: body stream cuma boleh dibaca SATU kali. clone() dulu untuk
    // cache - pakai response.body langsung membuat stream "disturbed" dan
    // response yang dikembalikan ke klien melempar error. put di waitUntil
    // supaya klien tidak menunggu penulisan cache.
    const forCache = new Response(response.clone().body, {
      status: response.status,
      headers,
    });
    ctx.waitUntil(edgeCache.put(cacheKeyRequest(request, versionId), forCache));
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

    if (!isCacheableRequest(method, pathname, url.search)) {
      return forHead(request, forBrowser(await render(request), 'bypass'));
    }

    const versionId = env.CF_VERSION_METADATA?.id ?? 'dev';
    const key = cacheKeyRequest(request, versionId);
    const cached = await edgeCache.match(key);
    if (cached) {
      const ttlS = Number(cached.headers.get('x-cache-ttl') ?? STALE_MAX_S);
      const ageS =
        (Date.now() - Number(cached.headers.get('x-cached-at') ?? 0)) / 1000;
      if (ageS >= ttlS) {
        const response = await renderAndCache(request, ctx, versionId);
        return forHead(request, forBrowser(response, 'miss'));
      }
      const freshS = Math.min(freshSeconds(pathname), ttlS);
      if (ageS > freshS) {
        ctx.waitUntil(renderAndCache(request, ctx, versionId));
      }
      return forHead(
        request,
        forBrowser(cached, ageS <= freshS ? 'hit' : 'swr'),
      );
    }

    const response = await renderAndCache(request, ctx, versionId);
    return forHead(request, forBrowser(response, 'miss'));
  },
} satisfies ExportedHandler<EdgeEnv>;
