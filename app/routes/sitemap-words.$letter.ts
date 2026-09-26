import type { Route } from './+types/sitemap-words.$letter';
import { env } from '../infrastructure/config/env';

/**
 * Lokasi lama sitemap per huruf. Isi kanonik sekarang satu urlset di /sitemap.xml.
 */
export async function loader({ params }: Route.LoaderArgs) {
  if (!env.isProd) {
    throw new Response('Not Found', { status: 404 });
  }
  if (!/^[a-z]$/.test(params.letter ?? '')) {
    throw new Response('Not Found', { status: 404 });
  }
  return Response.redirect(`${env.appUrl}/sitemap.xml`, 301);
}
