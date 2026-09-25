// Service worker SambasKu: offline untuk halaman yang pernah dikunjungi.
//
// Strategi (sengaja konservatif supaya deploy baru tidak pernah "nyangkut"
// pada HTML basi):
// - Navigasi (HTML)  : network-first; cache runtime hanya fallback saat
//                      offline. Online = selalu segar.
// - /assets/ /fonts/ : cache-first (nama file content-hashed + immutable).
// - Lainnya (API,    : lewat langsung tanpa SW cache.
//   rss/sitemap/og)
//
// HTML yang di-cache selalu di-strip Set-Cookie dulu (Cache API menolak
// respons ber-cookie secara diam-diam - pola yang sama dengan worker.ts).
const VERSION = 'sk-v1';
const PAGE_CACHE = `${VERSION}-pages`;
const ASSET_CACHE = `${VERSION}-assets`;
// Path kanonik TANPA .html: Workers Static Assets me-redirect
// /offline.html → /offline (pretty URL), dan respons ber-redirect ditolak
// cache.add secara diam-diam.
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isCacheableAsset(pathname) {
  return (
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/fonts/') ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon-192.png' ||
    pathname === '/apple-touch-icon.png' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/offline'
  );
}

async function cachePut(cache, request, response) {
  const copy = response.clone();
  const headers = new Headers(copy.headers);
  headers.delete('Set-Cookie');
  headers.set('x-sw-cached-at', String(Date.now()));
  await cache.put(request, new Response(copy.body, {
    status: copy.status,
    statusText: copy.statusText,
    headers,
  }));
}

async function handleNavigation(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      try {
        await cachePut(cache, request, response);
      } catch {
        // gagal menulis cache bukan alaman gagalnya navigasi
      }
    }
    return response;
  } catch {
    const cached = (await cache.match(request)) || (await cache.match(OFFLINE_URL));
    return (
      cached ||
      new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
    );
  }
}

async function handleAsset(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    try {
      await cachePut(cache, request, response);
    } catch {
      // sama: kegagalan cache tidak boleh gagalkan aset
    }
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }
  if (isCacheableAsset(url.pathname)) {
    event.respondWith(handleAsset(request));
  }
  // sisanya (api/rss/sitemap/og/png dinamis): network saja
});
