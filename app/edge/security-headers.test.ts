import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import {
  apiConnectOriginsFrom,
  buildCsp,
  buildSecurityHeaders,
} from './security-headers.ts';

/**
 * Tier API produksi. Sumber masalah BH-06: `connect-src` pernah ditulis manual di
 * `public/_headers` dan bisa diam-diam berbeda dari `VITE_API_BASE_URL` yang
 * dipakai build. Test ini mengunci kedua sisinya ke satu nilai, jadi mengubah
 * tier gagal di CI - bukan diam-diam di browser.
 */
const PROD_TIER = [
  'https://api.sambasku.com/api/v1',
  'https://deno.sambasku.com/api/v1',
  'https://render.sambasku.com/api/v1',
];

const PROD_HEADERS = buildSecurityHeaders({
  apiConnectOrigins: apiConnectOriginsFrom(PROD_TIER),
  isProd: true,
});

describe('apiConnectOriginsFrom', () => {
  it('mengambil origin https dan membuang duplikat', () => {
    assert.deepEqual(
      apiConnectOriginsFrom([
        'https://api.sambasku.com/api/v1',
        'https://api.sambasku.com/api/v1',
        'https://deno.sambasku.com/api/v1',
      ]),
      ['https://api.sambasku.com', 'https://deno.sambasku.com'],
    );
  });

  it('membuang URL non-https dan URL rusak', () => {
    assert.deepEqual(
      apiConnectOriginsFrom([
        '/api/v1',
        'http://api.sambasku.com',
        'bukan-url',
        '',
      ]),
      [],
    );
  });
});

describe('buildCsp', () => {
  it('produksi tidak memuat unsafe-eval (W-02)', () => {
    assert.ok(
      !buildCsp({ apiConnectOrigins: [], isProd: true }).includes(
        'unsafe-eval',
      ),
    );
  });

  it('dev/staging memuat unsafe-eval untuk HMR', () => {
    assert.ok(
      buildCsp({ apiConnectOrigins: [], isProd: false }).includes(
        "'unsafe-eval'",
      ),
    );
  });

  it('connect-src memuat semua origin fallback (W-01)', () => {
    const csp = buildCsp({
      apiConnectOrigins: apiConnectOriginsFrom(PROD_TIER),
      isProd: true,
    });
    for (const origin of [
      'https://api.sambasku.com',
      'https://deno.sambasku.com',
      'https://render.sambasku.com',
    ]) {
      assert.ok(csp.includes(origin), `connect-src tidak memuat ${origin}`);
    }
  });

  // BH-02: foto stock lewat wsrv.nl, jadi img-src tidak perlu host baru.
  // Widening ke `img-src https:` akan membuka Allowlist W-09.
  it('img-src tetap sempit dan memuat wsrv.nl', () => {
    const csp = buildCsp({ apiConnectOrigins: [], isProd: true });
    const imgSrc = csp.split('; ').find((d) => d.startsWith('img-src'));
    assert.ok(imgSrc);
    assert.ok(imgSrc.includes('https://wsrv.nl'));
    assert.ok(
      !imgSrc.includes('img-src https:'),
      'img-src tidak boleh wildcard https:',
    );
    for (const host of [
      'live.staticflickr.com',
      'cdn.pixabay.com',
      'api.openverse.org',
    ]) {
      assert.ok(
        !imgSrc.includes(host),
        `img-src tidak boleh memuat ${host} langsung`,
      );
    }
  });
});

describe('public/_headers (BH-06)', () => {
  const headersPath = fileURLToPath(
    new URL('../../public/_headers', import.meta.url),
  );
  const file = readFileSync(headersPath, 'utf8');

  function headerValue(name: string): string | undefined {
    const line = file
      .split('\n')
      .find((l) => l.trim().toLowerCase().startsWith(`${name.toLowerCase()}:`));
    return line?.slice(line.indexOf(':') + 1).trim();
  }

  // Directive CSP diakhiri titik koma, jadi `;` di ujung tidak mengubah
  // makna. Yang diuji adalah policynya, bukan format penulisan.
  function matchesBuild(name: string): boolean {
    const onFile = headerValue(name);
    if (onFile === undefined) return false;
    const trimCsp = (v: string) => v.replace(/;\s*$/, '');
    if (name.toLowerCase() === 'content-security-policy') {
      return (
        trimCsp(onFile) === trimCsp(PROD_HEADERS[name]) &&
        onFile.includes('https://deno.sambasku.com') &&
        onFile.includes('https://render.sambasku.com')
      );
    }
    return onFile === PROD_HEADERS[name];
  }

  it('CSP aset statis identik dengan yang dikirim worker ke respons SSR', () => {
    assert.ok(
      matchesBuild('Content-Security-Policy'),
      `connect-src di _headers berbeda dari tier produksi:\n` +
        `  file : ${headerValue('Content-Security-Policy')}\n` +
        `  build: ${PROD_HEADERS['Content-Security-Policy']}`,
    );
  });

  it('semua header keamanan worker ada di _headers', () => {
    for (const name of Object.keys(PROD_HEADERS)) {
      assert.ok(
        matchesBuild(name),
        `header ${name} tidak cocok dengan build worker`,
      );
    }
  });

  // Guard ini juga menangkap skenario "build staging lalu commit": build staging
  // menulis `connect-src` staging ke file ini. Karena itu `pnpm test` di
  // kedua workflow WAJIB jalan sebelum `pnpm build` - sekarang urutannya
  // Lint -> Typecheck -> Unit test -> Build.
  it('tidak ada host staging yang bocor ke aset statis', () => {
    assert.ok(!file.includes('sambasku-staging'));
    assert.ok(!file.includes('iamutaki.com'));
  });
});
