import { env } from '@/infrastructure/config/env';

/**
 * robots.txt dinamis: produksi mengizinkan perayapan + referensi sitemap,
 * staging/dev menolak semua (mencegah terlisting di search engine).
 */
export async function loader() {
  const body = env.isProd
    ? `User-agent: *\nAllow: /\n\nSitemap: ${env.appUrl}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
