import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { displayImageUrl } from './display-image-url.ts';

describe('displayImageUrl (pentest W-10: validasi skema di trust boundary)', () => {
  it('menolak skema non-https', () => {
    assert.equal(displayImageUrl('http://cdn.jsdelivr.net/gh/sambasku/x.webp'), undefined);
    assert.equal(displayImageUrl('javascript:alert(1)'), undefined);
    assert.equal(displayImageUrl('data:image/png;base64,xxxx'), undefined);
  });

  it('menolak URL yang tidak valid dan input kosong', () => {
    assert.equal(displayImageUrl('bukan url'), undefined);
    assert.equal(displayImageUrl(''), undefined);
    assert.equal(displayImageUrl(undefined), undefined);
  });

  it('https jsDelivr dibungkus wsrv.nl', () => {
    const wrapped = displayImageUrl('https://cdn.jsdelivr.net/gh/sambasku/audios/a.webp', {
      width: 800,
    });
    assert.match(wrapped ?? '', /^https:\/\/wsrv\.nl\//);
  });

  it('https host lain dikembalikan apa adanya', () => {
    assert.equal(
      displayImageUrl('https://ik.imagekit.io/abc/x.webp'),
      'https://ik.imagekit.io/abc/x.webp',
    );
  });
});
