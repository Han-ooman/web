import { buildSitemapIndexXml } from '../application/utils/sitemap';
import { env } from '../infrastructure/config/env';

/**
 * Sitemap index: /sitemap.xml hanya mendaftar anak-anaknya
 * (/sitemap-static.xml + /sitemap-words/{a..z}) tanpa subrequest API.
 *
 * Anak kata dipecah per huruf awal supaya tiap request hanya mem- walk satu
 * huruf (anggaran 50 subrequest paket gratis per request), bukan seluruh
 * korpus seperti sitemap tunggal lama yang terpotong diam-diam di 1.000 kata
 * (MAX_PAGES 10 x PAGE_SIZE 100). Batas baru: 50 x 100 = 5.000 kata PER
 * HURUF.
 *
 * Lemma ber-awalan non A-Z (angka/diakritik) tidak masuk anak manapun; korpus
 * Sambas ber-Latin sehingga populasinya nol. Kalau muncul, tambah anak
 * /sitemap-words/other yang memakai walk tanpa filter letter.
 */
export async function loader() {
  if (!env.isProd) {
    throw new Response('Not Found', { status: 404 });
  }

  return new Response(buildSitemapIndexXml(env.appUrl), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
