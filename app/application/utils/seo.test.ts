import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  lemmaAltFromLocalizedPath,
  resolveOgImageSize,
} from './og-image-meta.ts';

describe('resolveOgImageSize', () => {
  it('fallback logo 512x512 kalau halaman tidak mengirim gambar', () => {
    assert.deepEqual(
      resolveOgImageSize(undefined, 'https://sambasku.com/logo.png'),
      { width: 512, height: 512 },
    );
  });

  it('kartu /og/words/ selalu 1200x630', () => {
    assert.deepEqual(
      resolveOgImageSize(
        'https://sambasku.com/og/words/somet',
        'https://sambasku.com/og/words/somet',
      ),
      { width: 1200, height: 630 },
    );
    assert.deepEqual(
      resolveOgImageSize(
        'https://sambasku.com/og/words/a%20b',
        'https://sambasku.com/og/words/a%20b',
      ),
      { width: 1200, height: 630 },
    );
  });

  it('foto yang hanya punya lebar tidak mengarang tinggi', () => {
    assert.equal(
      resolveOgImageSize(
        'https://wsrv.nl/?url=https%3A%2F%2Fcdn.example&w=1200',
        'https://wsrv.nl/?url=https%3A%2F%2Fcdn.example&w=1200',
      ),
      null,
    );
  });

  it('ukuran eksplisit mengalahkan deteksi', () => {
    assert.deepEqual(
      resolveOgImageSize('https://cdn.example/a.jpg', 'https://cdn.example/a.jpg', 800, 400),
      { width: 800, height: 400 },
    );
  });
});

describe('lemmaAltFromLocalizedPath', () => {
  it('mengambil lemma dari path ber-locale', () => {
    assert.equal(lemmaAltFromLocalizedPath('/id/words/somet'), 'somet');
    assert.equal(lemmaAltFromLocalizedPath('/id-SBS/words/a%20b'), 'a b');
  });

  it('bukan halaman kata', () => {
    assert.equal(lemmaAltFromLocalizedPath('/id'), null);
    assert.equal(lemmaAltFromLocalizedPath('/id/words'), null);
    assert.equal(lemmaAltFromLocalizedPath('/id/faq'), null);
  });
});
