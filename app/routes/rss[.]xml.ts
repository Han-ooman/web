import {
  listLatestWords,
  type LatestWord,
} from '../application/use-cases/word.use-case';
import { buildRssXml } from '../application/utils/rss';
import { env } from '../infrastructure/config/env';
import {
  DEFAULT_LOCALE,
  localePath,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';

/**
 * RSS kata terbaru (/rss.xml). Satu feed (locale default): isi feed adalah
 * data kamus yang identik antar locale UI, jadi feed per-locale hanya
 * menggandakan pemeliharaan tanpa nilai tambah bagi pembaca.
 *
 * Fail-closed seperti sitemap (pentest BH-09): jangan pernah simpan feed
 * kosong di edge hanya karena API sempat gagal. `return`, bukan `throw`,
 * supaya Retry-After ikut dan error boundary HTML tidak merender.
 */
export async function loader() {
  if (!env.isProd) {
    throw new Response('Not Found', { status: 404 });
  }

  const t = getFixedT(DEFAULT_LOCALE);

  let latest: LatestWord[] = [];
  try {
    const res = await listLatestWords({ limit: 20 });
    latest = res.data;
  } catch (err) {
    console.error('[rss] gagal mengambil kata terbaru', err);
    return new Response('Service Unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '600' },
    });
  }

  const xml = buildRssXml(env.appUrl, {
    title: t('seo_rssTitle'),
    description: t('seo_rssDescription'),
    linkPath: localePath(DEFAULT_LOCALE, '/'),
    language: DEFAULT_LOCALE,
    lastBuildDate: latest[0]?.approved_at ?? new Date().toISOString(),
    items: latest.map((w) => ({
      title: w.lemma,
      path: localePath(DEFAULT_LOCALE, `/words/${encodeURIComponent(w.lemma)}`),
      description: w.sense ?? t('seo_rssDescription'),
      publishedAt: w.approved_at,
    })),
  });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
