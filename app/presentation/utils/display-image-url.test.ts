import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  displayImageUrl,
  isAllowedDisplayImageUrl,
  isProxiedImageHost,
} from './display-image-url.ts';

describe('displayImageUrl (pentest W-10/BH-02/BH-03)', () => {
  it('menolak skema non-https', () => {
    assert.equal(
      displayImageUrl('http://cdn.jsdelivr.net/gh/sambasku/x.webp'),
      undefined,
    );
    assert.equal(displayImageUrl('javascript:alert(1)'), undefined);
    assert.equal(displayImageUrl('data:image/png;base64,xxxx'), undefined);
  });

  it('menolak URL yang tidak valid dan input kosong', () => {
    assert.equal(displayImageUrl('bukan url'), undefined);
    assert.equal(displayImageUrl(''), undefined);
    assert.equal(displayImageUrl(undefined), undefined);
  });

  it('https jsDelivr dibungkus wsrv.nl', () => {
    const wrapped = displayImageUrl(
      'https://cdn.jsdelivr.net/gh/sambasku/audios/a.webp',
      {
        width: 800,
      },
    );
    assert.match(wrapped ?? '', /^https:\/\/wsrv\.nl\//);
    const params = new URL(wrapped ?? '').searchParams;
    assert.equal(
      params.get('url'),
      'cdn.jsdelivr.net/gh/sambasku/audios/a.webp',
    );
    assert.equal(params.get('w'), '800');
    assert.equal(params.get('output'), 'webp');
  });

  it('https host lain dikembalikan apa adanya', () => {
    assert.equal(
      displayImageUrl('https://ik.imagekit.io/abc/x.webp'),
      'https://ik.imagekit.io/abc/x.webp',
    );
  });

  // BH-02: host CDN foto stock tidak ada di allowlist CSP img-src, sehingga
  // <img src={preview_url}> mentah diblokir CSP. Semua harus lewat wsrv.nl.
  it('host CDN foto stock dibungkus wsrv.nl', () => {
    const stock = [
      'https://live.staticflickr.com/65535/52000000000_0000000000_b.jpg',
      'https://cdn.pixabay.com/photo/2015/03/26/10/28/sunflowers-908227_1280.jpg',
      'https://api.openverse.org/v1/images/abc123/thumb/',
    ];
    for (const url of stock) {
      const wrapped = displayImageUrl(url, { width: 320, height: 110 });
      assert.match(
        wrapped ?? '',
        /^https:\/\/wsrv\.nl\//,
        `tidak diproksi: ${url}`,
      );
      assert.equal(
        new URL(wrapped ?? '').searchParams.get('url'),
        new URL(url).host + new URL(url).pathname,
      );
    }
  });

  it('suffix host dicocokkan pada batas label, bukan substring', () => {
    assert.equal(isProxiedImageHost('cdn.jsdelivr.net'), true);
    assert.equal(
      isProxiedImageHost('evilcdn.jsdelivr.net.attacker.test'),
      false,
    );
    assert.equal(isProxiedImageHost('pixabay.com.evil.test'), false);
    assert.equal(isProxiedImageHost('CDN.PIXABAY.COM'), true);
  });

  // BH-03: host di luar allowlist tidak boleh lolos sebagai "layak tampil"
  // even though displayImageUrl still returns it (browser will block it).
  it('isAllowedDisplayImageUrl menolak host di luar allowlist', () => {
    assert.equal(isAllowedDisplayImageUrl('https://evil.test/x.png'), false);
    assert.equal(
      isAllowedDisplayImageUrl('http://cdn.pixabay.com/x.png'),
      false,
    );
    assert.equal(isAllowedDisplayImageUrl(''), false);
    assert.equal(isAllowedDisplayImageUrl(undefined), false);
    assert.equal(
      isAllowedDisplayImageUrl('https://cdn.pixabay.com/x.png'),
      true,
    );
  });
});
