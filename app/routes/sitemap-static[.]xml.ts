import {
  SITEMAP_LETTERS,
  buildUrlsetXml,
  type SitemapItem,
} from '../application/utils/sitemap';
import { env } from '../infrastructure/config/env';

/**
 * Anak statis sitemap: rute tetap + 26 halaman huruf, kedua locale, tanpa
 * subrequest API.
 */
export async function loader() {
  if (!env.isProd) {
    throw new Response('Not Found', { status: 404 });
  }

  const today = new Date().toISOString().split('T')[0];

  const items: SitemapItem[] = [
    { bare: '/', priority: '1.0', changefreq: 'daily', lastmod: today },
    { bare: '/words', priority: '0.9', changefreq: 'daily', lastmod: today },
    ...SITEMAP_LETTERS.map(
      (l) =>
        ({
          bare: `/huruf/${l}`,
          priority: '0.6',
          changefreq: 'weekly',
          lastmod: today,
        }) satisfies SitemapItem,
    ),
    { bare: '/bantuan-terjemahan', priority: '0.7', changefreq: 'daily', lastmod: today },
    { bare: '/faq', priority: '0.8', changefreq: 'monthly', lastmod: today },
    { bare: '/privacy-policy', priority: '0.5', changefreq: 'yearly', lastmod: today },
    { bare: '/hapus-akun', priority: '0.4', changefreq: 'yearly', lastmod: today },
  ];

  return new Response(buildUrlsetXml(env.appUrl, items), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
