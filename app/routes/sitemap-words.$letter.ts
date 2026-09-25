import type { Route } from './+types/sitemap-words.$letter';
import { listWordsAtoZ } from '../application/use-cases/word.use-case';
import { buildUrlsetXml, type SitemapItem } from '../application/utils/sitemap';
import { env } from '../infrastructure/config/env';

/**
 * Anggaran SUBREQUEST, bukan cuma timeout (lihat komentar lama di bawah).
 * Tiap halaman API = satu subrequest Worker; paket gratis 50 per request.
 * Anak ini hanya mem- walk SATU huruf, jadi 50 halaman = 5.000 kata per
 * huruf - jauh di atas kebutuhan korpus saat ini.
 */
const PAGE_SIZE = 100;
const MAX_PAGES = 50;

/**
 * Anak sitemap lemma per huruf awal: /sitemap-words/{a..z}.
 *
 * Fail-closed, bukan fail-open (pentest BH-09). `return`, bukan `throw`:
 * throw merender error boundary HTML padahal ini endpoint XML, dan header
 * Retry-After perlu ikut apa adanya. 503 tidak punya TTL di cacheTtlSeconds
 * sehingga tidak masuk cache edge; crawler mencoba lagi - persis perilaku
 * yang diinginkan saat korpus sedang tidak terbaca.
 */
export async function loader({ params }: Route.LoaderArgs) {
  if (!env.isProd) {
    throw new Response('Not Found', { status: 404 });
  }
  if (!/^[a-z]$/.test(params.letter ?? '')) {
    throw new Response('Not Found', { status: 404 });
  }
  const letter = params.letter;

  const today = new Date().toISOString().split('T')[0];
  const items: SitemapItem[] = [];

  try {
    let cursor: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await listWordsAtoZ({ letter, limit: PAGE_SIZE, cursor });
      for (const word of res.data) {
        items.push({
          bare: `/words/${encodeURIComponent(word.lemma)}`,
          priority: '0.7',
          changefreq: 'weekly',
          lastmod: today,
        });
      }
      const next = res.meta?.next_cursor ?? null;
      if (!res.meta?.has_more || !next) break;
      cursor = next;
    }
  } catch (err) {
    console.error('[sitemap-words] gagal mengambil daftar kata', err);
    return new Response('Service Unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '600' },
    });
  }

  return new Response(buildUrlsetXml(env.appUrl, items), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
