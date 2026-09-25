/**
 * URL tampilan gambar untuk web publik.
 *
 * Ini adalah choke point kedua setelah validasi API: data gambar datang dari
 * API yang sebagian isinya kontribusi user (pentest W-10) dan, untuk Media
 * Explorer, diteruskan apa adanya dari host CDN pihak ketiga.
 *
 * Aturan:
 * 1. Skema selain https: ditolak (undefined).
 * 2. Host pada `PROXIED_HOST_SUFFIXES` (jsDelivr + CDN foto stock) dibungkus
 *    wsrv.nl untuk resize. Ini membuat CSP `img-src` tetap sempit - host baru
 *    tidak perlu ditambahkan ke allowlist, dan CSP tidak perlu dilonggarkan
 *    menjadi `img-src https:` (pentest BH-02).
 * 3. Host lain yang https tetap dikembalikan apa adanya; kalau hostnya di luar
 *    CSP, browser akan memblokir gambarnya (fail-closed), bukan memuatnya.
 *
 * Daftar host stock di sini cerminan `STOCK_URL_HOST_SUFFIXES` di
 * `api/src/modules/word/domain/word-image-provider.ts` (suffix match,
 * case-insensitive, batas label '.'). Ubah di sana dulu kalau provider berubah.
 */

/** Host yang SELALU diproksi lewat wsrv.nl. */
const PROXIED_HOST_SUFFIXES: readonly string[] = [
  // Media repo GitHub.
  'cdn.jsdelivr.net',
  // Foto stock: Pixabay (largeImageURL/webformatURL).
  'cdn.pixabay.com',
  'pixabay.com',
  // Foto stock: Openverse mengagregasi Flickr; thumbnail dari API itself.
  'live.staticflickr.com',
  'api.openverse.org',
  // Foto stock: Pexels / Unsplash / Wikimedia (legacy `provider` di DB).
  'images.pexels.com',
  'images.unsplash.com',
  'plus.unsplash.com',
  'upload.wikimedia.org',
  // Thumbnail video Pixabay (bila share-backgrounds mengembalikan video).
  'i.vimeocdn.com',
];

/** Cocokkan host terhadap daftar suffix dengan batas label ('.', bukan substring). */
export function isProxiedImageHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return PROXIED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

/**
 * True bila URL gambar layak ditampilkan: https dan host-nya ada di allowlist
 * yang diproksi. Dipakai juga untuk memvalidasi payload kontribusi sebelum
 * dikirim ke API (pentest BH-03) - bukan sebagai pengganti validasi server.
 */
export function isAllowedDisplayImageUrl(
  url: string | null | undefined,
): boolean {
  if (!url) return false;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  return u.protocol === 'https:' && isProxiedImageHost(u.hostname);
}

/**
 * URL untuk `<img src>`: string https, atau undefined kalau tidak layak
 * ditampilkan (skema non-https, URL rusak, atau input kosong).
 *
 * Host stock punya ukuran penuh dari CDN dan bisa beberapa MB, jadi selalu
 * minta resize dari proxy.
 */
export function displayImageUrl(
  url: string | null | undefined,
  opts: { width?: number; height?: number } = {},
): string | undefined {
  if (!url) return undefined;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return undefined;
  }
  if (u.protocol !== 'https:') return undefined;
  if (!isProxiedImageHost(u.hostname)) return url;

  const params = new URLSearchParams();
  params.set('url', `${u.host}${u.pathname}${u.search}`);
  if (opts.width) params.set('w', String(opts.width));
  if (opts.height) params.set('h', String(opts.height));
  params.set('fit', 'cover');
  params.set('output', 'webp');
  return `https://wsrv.nl/?${params.toString()}`;
}
