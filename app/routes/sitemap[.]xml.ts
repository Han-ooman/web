import { listWordsAtoZ } from '../application/use-cases/word.use-case';
import { env } from '../infrastructure/config/env';

export async function loader() {
  // Sitemap hanya untuk produksi - staging noindex total.
  if (!env.isProd) {
    throw new Response('Not Found', { status: 404 });
  }

  const staticRoutes = [
    { path: '', priority: '1.0', changefreq: 'daily' },
    { path: '/words', priority: '0.9', changefreq: 'daily' },
  ];

  let wordEntries: Array<{ path: string; priority: string; changefreq: string }> = [];

  try {
    const res = await listWordsAtoZ({ limit: 100 });
    wordEntries = res.data.map((word) => ({
      path: `/words/${word.id}`,
      priority: '0.7',
      changefreq: 'weekly',
    }));
  } catch {
    // If API fails during sitemap generation, still serve static routes
    wordEntries = [];
  }

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
