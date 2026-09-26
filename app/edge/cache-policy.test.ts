import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  SITEMAP_PATH,
  cacheKeyUrl,
  cacheTtlSeconds,
  canonicalCachePath,
  freshSeconds,
  isCacheableRequest,
  isOgImagePath,
  isSitemapPath,
} from './cache-policy.ts';

describe('canonicalCachePath (pentest BH-04)', () => {
  it('menyatukan slash ganda dan membuang trailing slash', () => {
    assert.equal(canonicalCachePath('/id//words//x'), '/id/words/x');
    assert.equal(canonicalCachePath('/id/words/x/'), '/id/words/x');
    assert.equal(canonicalCachePath('/id/words/x///'), '/id/words/x');
    assert.equal(canonicalCachePath('/id/'), '/id');
  });

  it('menyelesaikan segmen . dan ..', () => {
    assert.equal(canonicalCachePath('/id/./words/./x'), '/id/words/x');
    assert.equal(canonicalCachePath('/id/words/../words/x'), '/id/words/x');
    assert.equal(canonicalCachePath('/id/../../admin'), '/admin');
  });

  it('root tetap root dan path kosong tidak jadi undefined', () => {
    assert.equal(canonicalCachePath('/'), '/');
    assert.equal(canonicalCachePath('//'), '/');
    assert.equal(canonicalCachePath(''), '/');
  });

  // Men-decode %2F akan mengubah arti path (encoded slash = data, bukan separator).
  it('tidak men-decode persent-encoding', () => {
    assert.equal(canonicalCachePath('/id/words/a%2Fb'), '/id/words/a%2Fb');
    assert.equal(canonicalCachePath('/id/words/a%20b'), '/id/words/a%20b');
  });

  it('varian path dengan isi identik menghasilkan satu kunci cache', () => {
    const variants = [
      '/id/words/x',
      '/id/words/x/',
      '/id//words//x',
      '/id/./words/x',
    ];
    const keys = new Set(
      variants.map((p) => cacheKeyUrl('https://sambasku.com', p, 'v1')),
    );
    assert.equal(keys.size, 1);
  });
});

describe('cacheKeyUrl', () => {
  it('membuang query string masukan dan mengunci versi deploy', () => {
    assert.equal(
      cacheKeyUrl('https://sambasku.com', '/id/words/x', 'abc123'),
      'https://sambasku.com/id/words/x?__build=abc123',
    );
  });

  it('prefix locale berbeda tidak berbagi entry', () => {
    const id = cacheKeyUrl('https://sambasku.com', '/id/words/x', 'v1');
    const sbs = cacheKeyUrl('https://sambasku.com', '/id-SBS/words/x', 'v1');
    assert.notEqual(id, sbs);
  });
});

describe('isCacheableRequest', () => {
  it('menyala untuk beranda per-locale dan detail kata', () => {
    assert.equal(isCacheableRequest('GET', '/id'), true);
    assert.equal(isCacheableRequest('GET', '/id-SBS'), true);
    assert.equal(isCacheableRequest('GET', '/id/words/capal'), true);
    assert.equal(isCacheableRequest('HEAD', '/id/words/capal'), true);
    assert.equal(isCacheableRequest('GET', SITEMAP_PATH), true);
  });

  // BH-08: setiap path tanpa prefix locale adalah redirect (routes.ts), jadi
  // tidak pernah 200 dan tidak pernah punya TTL > 0.
  it('path redirect legacy tidak di-cache (BH-08)', () => {
    assert.equal(isCacheableRequest('GET', '/'), false);
    assert.equal(isCacheableRequest('GET', '/words/capal'), false);
    assert.equal(isCacheableRequest('GET', '/search'), false);
  });

  it('daftar kata dan halaman dengan filter query tidak di-cache', () => {
    assert.equal(isCacheableRequest('GET', '/id/words'), false);
    assert.equal(isCacheableRequest('GET', '/id/words?page=2'), false);
    assert.equal(isCacheableRequest('GET', '/id/search'), false);
  });

  it('metode selain GET/HEAD tidak di-cache', () => {
    assert.equal(isCacheableRequest('POST', '/id/words/capal'), false);
    assert.equal(isCacheableRequest('TRACE', '/id'), false);
  });

  it('varian trailing slash / slash ganda tidak mengubah cacheability', () => {
    assert.equal(isCacheableRequest('GET', '/id/words/capal/'), true);
    assert.equal(isCacheableRequest('GET', '/id//words//capal'), true);
  });

  it('halaman huruf satu karakter di-cache, varian liar tidak (anti flooding)', () => {
    assert.equal(isCacheableRequest('GET', '/id/huruf/k'), true);
    assert.equal(isCacheableRequest('GET', '/id-SBS/huruf/a'), true);
    assert.equal(isCacheableRequest('GET', '/id/huruf/k/'), true);
    // Huruf ganda/panjang/campuran tidak pernah 200 (loader 404) dan tidak
    // boleh bisa memperbanyak entry cache.
    assert.equal(isCacheableRequest('GET', '/id/huruf/kk'), false);
    assert.equal(isCacheableRequest('GET', '/id/huruf/k1'), false);
    assert.equal(isCacheableRequest('GET', '/id/huruf/k/x'), false);
    // Uppercase adalah 301 ke bentuk lowercase, bukan 200.
    assert.equal(isCacheableRequest('GET', '/id/huruf/K'), false);
  });

  it('URL ber-query tidak di-cache: kunci cache membuang query', () => {
    // '?cursor=' halaman 2+ harus render segar, bukan entry halaman 1.
    assert.equal(isCacheableRequest('GET', '/id/huruf/k', '?cursor=abc'), false);
    assert.equal(isCacheableRequest('GET', '/id/words/capal', '?utm=x'), false);
    assert.equal(isCacheableRequest('GET', '/id/huruf/k', ''), true);
  });
});

describe('cacheTtlSeconds', () => {
  it('200 dapat TTL penuh dan 404 kata dapat negative cache (G-02)', () => {
    assert.ok(cacheTtlSeconds('/id/words/capal', 200) > 0);
    assert.ok(cacheTtlSeconds('/id/words/capal', 404) > 0);
  });

  it('status lain tidak di-cache', () => {
    assert.equal(cacheTtlSeconds('/id/words/capal', 301), 0);
    assert.equal(cacheTtlSeconds('/id/words/capal', 500), 0);
    assert.equal(cacheTtlSeconds('/id', 404), 0);
    assert.equal(cacheTtlSeconds('/', 301), 0);
  });

  it('negative cache tetap aktif untuk varian path', () => {
    assert.ok(cacheTtlSeconds('/id/words/capal/', 404) > 0);
    assert.ok(cacheTtlSeconds('/id//words//capal', 404) > 0);
  });
});

describe('freshSeconds', () => {
  it('sitemap punya jendela segar jauh lebih panjang', () => {
    assert.ok(freshSeconds(SITEMAP_PATH) > freshSeconds('/id/words/capal'));
  });

  it('varian trailing slash sitemap tetap sama', () => {
    assert.equal(freshSeconds(`${SITEMAP_PATH}/`), freshSeconds(SITEMAP_PATH));
  });

  it('semua anak sitemap index ikut jendela segar panjang', () => {
    assert.equal(freshSeconds('/sitemap-static.xml'), freshSeconds(SITEMAP_PATH));
    assert.equal(freshSeconds('/sitemap-words/k'), freshSeconds(SITEMAP_PATH));
    // Varian liar bukan sitemap dan tidak boleh ikut istilah panjang.
    assert.equal(freshSeconds('/sitemap-words/kk'), freshSeconds('/id/words/capal'));
    assert.equal(freshSeconds('/sitemap-words/1'), freshSeconds('/id/words/capal'));
  });
});

describe('isSitemapPath', () => {
  it('menerima index, anak statis, dan anak huruf; menolak varian liar', () => {
    assert.equal(isSitemapPath('/sitemap.xml'), true);
    assert.equal(isSitemapPath('/sitemap-static.xml'), true);
    assert.equal(isSitemapPath('/sitemap-words/a'), true);
    assert.equal(isSitemapPath('/sitemap-words/z'), true);
    assert.equal(isSitemapPath('/sitemap-words/aa'), false);
    assert.equal(isSitemapPath('/sitemap-words/1'), false);
    assert.equal(isSitemapPath('/sitemap-words/a.xml'), false);
    // Trailing slash di-kanonikalisasi ke path yang sama (berbagi entry).
    assert.equal(isSitemapPath('/sitemap-words/a/'), true);
  });

  it('anak sitemap cacheable sebagai request', () => {
    assert.equal(isCacheableRequest('GET', '/sitemap-static.xml'), true);
    assert.equal(isCacheableRequest('GET', '/sitemap-words/k'), true);
    assert.equal(isCacheableRequest('GET', '/sitemap-words/kk'), false);
  });
});

describe('rss', () => {
  it('cacheable dengan jendela segar satu jam (bukan 60 detik)', () => {
    assert.equal(isCacheableRequest('GET', '/rss.xml'), true);
    assert.ok(freshSeconds('/rss.xml') > freshSeconds('/id/words/capal'));
    assert.ok(freshSeconds('/rss.xml') < freshSeconds(SITEMAP_PATH));
    // Varian dengan query atau trailing slash ekstra tidak lewat.
    assert.equal(isCacheableRequest('GET', '/rss.xml', '?x=1'), false);
  });
});

describe('og image', () => {
  it('path /og/words/{lemma} cacheable dengan jendela segar sehari', () => {
    assert.equal(isOgImagePath('/og/words/capal'), true);
    assert.equal(isOgImagePath('/og/words/a%20b'), true);
    assert.equal(isCacheableRequest('GET', '/og/words/capal'), true);
    assert.equal(freshSeconds('/og/words/capal'), 86400);
    // Varian lier (multi segmen, query, terlalu panjang) tidak di-cache.
    assert.equal(isCacheableRequest('GET', '/og/words/a/b'), false);
    assert.equal(isCacheableRequest('GET', '/og/words/x', '?v=2'), false);
  });

  it('404 kartu OG ikut negative cache pendek', () => {
    assert.ok(cacheTtlSeconds('/og/words/tidak-ada', 404) > 0);
    assert.equal(cacheTtlSeconds('/og/words/capal', 200) > 0, true);
    assert.equal(cacheTtlSeconds('/og/words/a/b', 404), 0);
  });
});
