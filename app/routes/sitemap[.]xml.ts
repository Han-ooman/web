import { listWordsAtoZ } from '../application/use-cases/word.use-case';
import { env } from '../infrastructure/config/env';
import {
  DEFAULT_LOCALE,
  localePath,
  seoLocales,
  type AppLocale,
} from '@/application/i18n/locales';

/**
 * Anggaran SUBREQUEST, bukan cuma timeout.
 *
 * Tiap halaman = satu subrequest Worker, dan paket gratis hanya mengizinkan 50
 * per request. MAX_PAGES 50 berarti route ini sendiri menghabiskan seluruh
 * anggaran dan dijamin gagal begitu korpus melewati 5.000 kata. 10 halaman
 * (1.000 kata) menyisakan ruang besar, dan hasilnya di-cache di edge oleh
 * `app/worker.ts` sehingga jarang dibangun ulang.
 *
 * `limit` API dibatasi 100 (max-nya), jadi PAGE_SIZE tidak bisa dinaikkan lagi.
 * Kalau korpus melewati 1.000 kata, pecah jadi sitemap index - jangan naikkan
 * MAX_PAGES kembali ke angka yang menyentuh batas.
 */
const PAGE_SIZE = 100;
const MAX_PAGES = 10;

function xhtmlAlternates(barePath: string): string {
  const locales = seoLocales();
  const lines = locales.map(
    (l) =>
      `    <xhtml:link rel="alternate" hreflang="${l.code}" href="${env.appUrl}${localePath(l.code as AppLocale, barePath)}" />`,
  );
  lines.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${env.appUrl}${localePath(DEFAULT_LOCALE, barePath)}" />`,
  );
  return lines.join('\n');
}

export async function loader() {
  if (!env.isProd) {
    throw new Response('Not Found', { status: 404 });
  }

  const staticBare = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/words', priority: '0.9', changefreq: 'daily' },
    { path: '/bantuan-terjemahan', priority: '0.7', changefreq: 'daily' },
    { path: '/faq', priority: '0.8', changefreq: 'monthly' },
    { path: '/privacy-policy', priority: '0.5', changefreq: 'yearly' },
    { path: '/hapus-akun', priority: '0.4', changefreq: 'yearly' },
  ];

  const wordBare = new Set<string>();

  try {
    let cursor: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await listWordsAtoZ({ limit: PAGE_SIZE, cursor });
      for (const word of res.data) {
        wordBare.add(`/words/${encodeURIComponent(word.lemma)}`);
      }
      const next = res.meta?.next_cursor ?? null;
      if (!res.meta?.has_more || !next) break;
      cursor = next;
    }
  } catch {
    // If API fails during sitemap generation, still serve static routes
  }

  const locales = seoLocales();
  const currentDate = new Date().toISOString().split('T')[0];

  type Entry = {
    locPath: string;
    bare: string;
    priority: string;
    changefreq: string;
  };

  const entries: Entry[] = [];
  for (const s of staticBare) {
    for (const l of locales) {
      entries.push({
        locPath: localePath(l.code as AppLocale, s.path === '/' ? '/' : s.path),
        bare: s.path,
        priority: s.priority,
        changefreq: s.changefreq,
      });
    }
  }
  for (const bare of wordBare) {
    for (const l of locales) {
      entries.push({
        locPath: localePath(l.code as AppLocale, bare),
        bare,
        priority: '0.7',
        changefreq: 'weekly',
      });
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries
  .map(
    (entry) => `  <url>
    <loc>${env.appUrl}${entry.locPath}</loc>
${xhtmlAlternates(entry.bare)}
    <lastmod>${currentDate}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
