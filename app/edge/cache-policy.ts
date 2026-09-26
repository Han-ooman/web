/**
 * Kebijakan cache edge untuk respons SSR.
 *
 * Dipisah dari `worker.ts` supaya pure dan bisa diuji tanpa runtime
 * Cloudflare (pentest BH-07): `worker.ts` mengimpor `virtual:react-router/
 * server-build` yang mustahil di-import di test runner.
 */
// Ekstensi `.ts` eksplisit: modul ini diimpor langsung oleh test yang jalan
// di `node --experimental-strip-types`, yang butuh specifier lengkap (ESM).
// Semua import relatif di repo tetap tanpa ekstensi.
import { stripLocalePrefix } from '../application/i18n/locales.ts';

/**
 * Bentuk kanonik pathname untuk kunci cache: satu slash pemisah, tanpa
 * segmen `.`/`..`, tanpa trailing slash (kecuali root).
 *
 * `new URL()` sudah menyelesaikan `.` dan `..`, tapi TIDAK menyatukan slash
 * ganda dan tidak membuang trailing slash - sehingga `/id/words/x`,
 * `/id/words/x/`, dan `/id//words//x` menjadi tiga entry cache berbeda untuk
 * konten yang identik (pentest BH-04). Tanpa kanonikalisasi ini, penyerang
 * bisa memperbanyak entry cache hanya dengan vary path.
 *
 * Persent-encoding TIDAK di-decode: `%2F` di dalam segmen adalah data,
 * bukan separator, dan decode-otomatis akan mengubah arti path.
 */
export function canonicalCachePath(pathname: string): string {
  const out: string[] = [];
  for (const segment of pathname.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      out.pop();
      continue;
    }
    out.push(segment);
  }
  return `/${out.join('/')}`;
}

/// HTML SSR memuat URL chunk ber-hash. Cache tanpa id deploy tetap
/// menyajikan HTML lama setelah wrangler deploy menghapus file itu (404).
///
/// Key dinormalisasi ke origin+pathname KANONIKLAL (prefix locale
/// dipertahankan: /id/words/x dan /id-SBS/words/x kontennya beda bahasa -
/// tidak boleh berbagi entry) dan query string masukan DIABUANG: halaman
/// cacheable tidak bergantung query, dan tanpa normalisasi tiap URL unik
/// membuat entry cache baru = cache flooding (pentest W-03/B-03).
export function cacheKeyUrl(
  origin: string,
  pathname: string,
  versionId: string,
): string {
  return `${origin}${canonicalCachePath(pathname)}?__build=${versionId}`;
}

/// Cache API hanya menerima GET; HEAD di-cache sebagai GET (pentest B-12).
export function cacheKeyRequest(request: Request, versionId: string): Request {
  const url = new URL(request.url);
  return new Request(cacheKeyUrl(url.origin, url.pathname, versionId), {
    method: 'GET',
  });
}

const FRESH_S = 60;
export const STALE_MAX_S = 86400;

/// Negative cache pendek untuk 404 halaman kata: tanpa ini /words/<random>
/// selalu memicu render SSR + subrequest API (pentest W-04).
const NEGATIVE_TTL_S = 60;

/// Sitemap jauh lebih mahal daripada satu halaman HTML (satu subrequest API per
/// halaman kata), dan isinya berubah lambat. Jendela segarnya sehari, bukan 60
/// detik, supaya crawler tidak memicu pembangunan ulang terus-menerus.
export const SITEMAP_PATH = '/sitemap.xml';
const SITEMAP_STATIC_PATH = '/sitemap-static.xml';
const SITEMAP_WORDS_RE = /^\/sitemap-words\/[a-z]$/;
const SITEMAP_FRESH_S = 86400;

/// Struktur sitemap index: index + anak statis + anak per huruf.
export function isSitemapPath(pathname: string): boolean {
  const canonical = canonicalCachePath(pathname);
  return (
    canonical === SITEMAP_PATH ||
    canonical === SITEMAP_STATIC_PATH ||
    SITEMAP_WORDS_RE.test(canonical)
  );
}

/// RSS dibangun dari satu subrequest API dan dibaca ulang pembaca feed tiap
/// jam; jendela segar 1 jam seimbang antara beban API dan kesegaran feed.
export const RSS_PATH = '/rss.xml';
const RSS_FRESH_S = 3600;

export const LLMS_FULL_PATH = '/llms-full.txt';
const LLMS_FULL_FRESH_S = 86400;

/// Kartu OG per kata: mahal dirender (resvg) dan isinya stabil per deploy,
/// jadi jendela segar sehari penuh. Karakter segmen sama dengan guard route.
const OG_WORDS_RE = /^\/og\/words\/[A-Za-z0-9%._~-]{1,100}$/;
const OG_FRESH_S = 86400;

export function isOgImagePath(pathname: string): boolean {
  return OG_WORDS_RE.test(canonicalCachePath(pathname));
}

export function freshSeconds(pathname: string): number {
  if (isSitemapPath(pathname)) return SITEMAP_FRESH_S;
  const canonical = canonicalCachePath(pathname);
  if (canonical === RSS_PATH) return RSS_FRESH_S;
  if (canonical === LLMS_FULL_PATH) return LLMS_FULL_FRESH_S;
  if (isOgImagePath(canonical)) return OG_FRESH_S;
  return FRESH_S;
}

/// Halaman huruf `/{locale}/huruf/:letter`: satu huruf a-z persis. Regex ketat
/// supaya `/huruf/<apapun>` tidak bisa memperbanyak entry cache.
const HURUF_PATH_RE = /^\/huruf\/[a-z]$/;

export function isCacheableRequest(
  method: string,
  pathname: string,
  search = '',
): boolean {
  // URL publik nyata berprefix /:locale (routes.ts) - '/words/…' polos hanyalah
  // redirect legacy yang tak pernah 200. Pengecekan memakai path TANPA prefix
  // locale (pentest B-02: selama ini cache tidak pernah menyala untuk
  // /id/words/…). HEAD ikut di-cache (pentest B-12): render HEAD dilakukan
  // sebagai GET sehingga entry berisi body penuh.
  // '/words' (daftar, ada filter query) dan '/search' sengaja tidak di-cache;
  // hanya beranda per-locale, halaman detail '/words/<lemma>', dan sitemap.
  //
  // Syarat locale WAJIB ada (pentest BH-08). Setiap path tanpa prefix locale
  // adalah redirect (routes.ts: `index` → root-redirect, `words/:lemma` →
  // legacy-redirect), jadi statusnya 301/302 dan `cacheTtlSeconds` selalu 0.
  // Sebelumnya isCacheable tetap menerima path itu, sehingga tiap request
  // melakukan lookup cache yang dijamin kosong lalu render SSR penuh - dan
  // path redirect adalah target termurah yang ada (tanpa subrequest API).
  // Perhatikan `stripLocalePrefix('/id')` juga mengembalikan path '/', jadi
  // sekadar menghapus `bare === '/'` akan mematikan cache beranda /id dan
  // /id-SBS yang memang 200 dan layak di-cache.
  const canonical = canonicalCachePath(pathname);
  const { locale, path: bare } = stripLocalePrefix(canonical);
  if (method !== 'GET' && method !== 'HEAD') return false;
  // Kunci cache membuang query string, jadi URL ber-query tidak boleh
  // di-cache: '?cursor=' halaman huruf akan menyajikan halaman 1 selamanya.
  // Sitemap/robots tidak punya query yang bermakna.
  if (search !== '') return false;
  if (isSitemapPath(canonical)) return true;
  if (canonical === RSS_PATH) return true;
  if (canonical === LLMS_FULL_PATH) return true;
  if (isOgImagePath(canonical)) return true;
  if (locale === null) return false;
  return bare === '/' || bare.startsWith('/words/') || HURUF_PATH_RE.test(bare);
}

/** TTL entry cache menurut status respons; 0 = jangan di-cache. */
export function cacheTtlSeconds(pathname: string, status: number): number {
  if (status === 200) return STALE_MAX_S;
  // Path nyata selalu berprefix /:locale - cek path BARE, bukan mentah
  // (pentest G-02: '/id/words/…' tak pernah match '/words/' sehingga
  // negative cache 404 tidak pernah aktif).
  const { path: bare } = stripLocalePrefix(canonicalCachePath(pathname));
  // path selalu berprefix locale, jadi `/` dan `/words/<lemma>` polos tidak
  // akan pernah sampai ke sini (lihat isCacheableRequest). Bulk request ke
  // path redirect itu hanya lookup cache yang dijamin kosong (pentest BH-08).
  if (status === 404 && (bare.startsWith('/words/') || isOgImagePath(bare))) {
    return NEGATIVE_TTL_S;
  }
  return 0;
}
