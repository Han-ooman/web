import { buildUrlsetXml, type SitemapItem } from '../application/utils/sitemap';
import { listWordsAtoZ } from '../application/use-cases/word.use-case';
import { env } from '../infrastructure/config/env';

/**
 * Satu urlset di /sitemap.xml: rute statis, halaman huruf yang punya
 * lemma terverifikasi, dan lemma terverifikasi saja.
 *
 * Anggaran subrequest Worker (paket gratis 50 per request). 40 halaman
 * menyisakan ruang di bawah batas itu. Kalau masih ada halaman berikutnya
 * setelah batas, 503 - jangan terbitkan urlset yang diam-diam terpotong.
 */
const PAGE_SIZE = 100;
const MAX_PAGES = 40;

function letterOf(lemma: string): string | null {
  const c = lemma.trim().charAt(0).toLowerCase();
  return c >= 'a' && c <= 'z' ? c : null;
}

/** YYYY-MM-DD dari ISO. Bentuk lain diabaikan supaya lastmod tidak bohong. */
function lastmodOf(updatedAt: string | null | undefined): string | undefined {
  if (!updatedAt) return undefined;
  const day = updatedAt.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : undefined;
}

export async function loader() {
  if (!env.isProd) {
    throw new Response('Not Found', { status: 404 });
  }

  const words: { lemma: string; lastmod?: string }[] = [];
  try {
    let cursor: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await listWordsAtoZ({
        isVerified: true,
        limit: PAGE_SIZE,
        cursor,
      });
      for (const word of res.data) {
        words.push({ lemma: word.lemma, lastmod: lastmodOf(word.updated_at) });
      }
      const next = res.meta?.next_cursor ?? null;
      if (!res.meta?.has_more || !next) break;
      if (page === MAX_PAGES - 1) {
        return new Response('Service Unavailable', {
          status: 503,
          headers: { 'Cache-Control': 'no-store', 'Retry-After': '600' },
        });
      }
      cursor = next;
    }
  } catch (err) {
    console.error('[sitemap] gagal mengambil daftar kata', err);
    return new Response('Service Unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '600' },
    });
  }

  const letters = [
    ...new Set(
      words
        .map((word) => letterOf(word.lemma))
        .filter((letter): letter is string => letter !== null),
    ),
  ].sort();

  const items: SitemapItem[] = [
    { bare: '/', priority: '1.0', changefreq: 'daily' },
    { bare: '/words', priority: '0.9', changefreq: 'daily' },
    ...letters.map(
      (letter) =>
        ({
          bare: `/huruf/${letter}`,
          priority: '0.6',
          changefreq: 'weekly',
        }) satisfies SitemapItem,
    ),
    { bare: '/bantuan-terjemahan', priority: '0.7', changefreq: 'daily' },
    { bare: '/faq', priority: '0.8', changefreq: 'monthly' },
    { bare: '/api-publik', priority: '0.6', changefreq: 'monthly' },
    { bare: '/privacy-policy', priority: '0.5', changefreq: 'yearly' },
    { bare: '/hapus-akun', priority: '0.4', changefreq: 'yearly' },
    ...words.map(
      (word) =>
        ({
          bare: `/words/${encodeURIComponent(word.lemma)}`,
          priority: '0.7',
          changefreq: 'weekly',
          lastmod: word.lastmod,
        }) satisfies SitemapItem,
    ),
  ];

  return new Response(buildUrlsetXml(env.appUrl, items), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
