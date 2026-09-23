import { listWordsAtoZ } from '../application/use-cases/word.use-case';
import { env } from '../infrastructure/config/env';

/** Max per request API = 100. Cap halaman agar Worker tidak timeout. */
const PAGE_SIZE = 100;
const MAX_PAGES = 50;

export async function loader() {
  // Sitemap hanya untuk produksi - staging noindex total.
  if (!env.isProd) {
    throw new Response('Not Found', { status: 404 });
  }

  const staticRoutes = [
    { path: '', priority: '1.0', changefreq: 'daily' },
    { path: '/words', priority: '0.9', changefreq: 'daily' },
    { path: '/faq', priority: '0.8', changefreq: 'monthly' },
    { path: '/privacy-policy', priority: '0.5', changefreq: 'yearly' },
  ];

  const wordPaths = new Set<string>();

  try {
    let cursor: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await listWordsAtoZ({ limit: PAGE_SIZE, cursor });
      for (const word of res.data) {
        wordPaths.add(`/words/${encodeURIComponent(word.lemma)}`);
      }
      const next = res.meta?.next_cursor ?? null;
      if (!res.meta?.has_more || !next) break;
      cursor = next;
    }
  } catch {
    // If API fails during sitemap generation, still serve static routes
  }

  const wordEntries = [...wordPaths].map((path) => ({
    path,
    priority: '0.7',
    changefreq: 'weekly',
  }));

  const allEntries = [...staticRoutes, ...wordEntries];
  const currentDate = new Date().toISOString().split('T')[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries
  .map(
    (entry) => `  <url>
    <loc>${env.appUrl}${entry.path}</loc>
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
