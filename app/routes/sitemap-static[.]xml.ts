import { env } from '../infrastructure/config/env';

/**
 * Lokasi lama sitemap anak. Isi kanonik sekarang satu urlset di /sitemap.xml.
 */
export async function loader() {
  if (!env.isProd) {
    throw new Response('Not Found', { status: 404 });
  }
  return Response.redirect(`${env.appUrl}/sitemap.xml`, 301);
}
