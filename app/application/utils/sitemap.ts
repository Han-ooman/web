/**
 * Pembangun XML sitemap (pure, tanpa import env) supaya bisa diuji
 * `node --test` seperti edge/cache-policy.
 *
 * Struktur: /sitemap.xml adalah sitemap index; anak-anaknya
 * /sitemap-static.xml (rute statis + halaman huruf) dan
 * /sitemap-words/{a..z} (lemma per huruf awal).
 */
// Ekstensi `.ts` eksplisit: modul ini diimpor langsung oleh test yang jalan
// di `node --experimental-strip-types`, yang butuh specifier lengkap (ESM).
// Semua import relatif di repo tetap tanpa ekstensi.
import {
  DEFAULT_LOCALE,
  localePath,
  seoLocales,
  type AppLocale,
} from '../i18n/locales.ts';

export const SITEMAP_LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface SitemapItem {
  /** Path tanpa prefix locale, mis. '/words' atau '/huruf/k'. */
  bare: string;
  priority: string;
  changefreq: string;
  lastmod: string;
}

/** Baris xhtml:link hreflang (per locale seoIndex + x-default). */
function xhtmlAlternates(appUrl: string, bare: string): string {
  const lines = seoLocales().map(
    (l) =>
      `    <xhtml:link rel="alternate" hreflang="${l.code}" href="${appUrl}${xmlEscape(localePath(l.code as AppLocale, bare))}" />`,
  );
  lines.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${appUrl}${xmlEscape(localePath(DEFAULT_LOCALE, bare))}" />`,
  );
  return lines.join('\n');
}

/**
 * urlset lengkap: setiap item × setiap locale seoIndex, tiap URL membawa
 * pasangan hreflang-nya.
 */
export function buildUrlsetXml(appUrl: string, items: SitemapItem[]): string {
  const urls = items
    .flatMap((item) =>
      seoLocales().map((l) => ({
        loc: `${appUrl}${localePath(l.code as AppLocale, item.bare)}`,
        bare: item.bare,
        priority: item.priority,
        changefreq: item.changefreq,
        lastmod: item.lastmod,
      })),
    )
    .map(
      (u) => `  <url>
    <loc>${xmlEscape(u.loc)}</loc>
${xhtmlAlternates(appUrl, u.bare)}
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;
}

/** sitemap index: rute statis + satu anak per huruf a-z. */
export function buildSitemapIndexXml(appUrl: string): string {
  const children = [
    '/sitemap-static.xml',
    ...SITEMAP_LETTERS.map((l) => `/sitemap-words/${l}`),
  ]
    .map((path) => `  <sitemap>
    <loc>${xmlEscape(`${appUrl}${path}`)}</loc>
  </sitemap>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${children}
</sitemapindex>`;
}
