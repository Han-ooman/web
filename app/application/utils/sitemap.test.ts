import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  SITEMAP_LETTERS,
  buildSitemapIndexXml,
  buildUrlsetXml,
  xmlEscape,
} from './sitemap.ts';

const APP_URL = 'https://sambasku.com';

describe('xmlEscape', () => {
  it('me-escape lima karakter wajib XML', () => {
    assert.equal(xmlEscape('a&b<c>d"e\'f'), 'a&amp;b&lt;c&gt;d&quot;e&apos;f');
  });

  it('string biasa tidak berubah', () => {
    assert.equal(xmlEscape('/id/words/capal'), '/id/words/capal');
  });
});

describe('buildUrlsetXml', () => {
  it('setiap item menjadi URL per locale seoIndex dengan hreflang', () => {
    const xml = buildUrlsetXml(APP_URL, [
      { bare: '/words', priority: '0.9', changefreq: 'daily', lastmod: '2026-09-26' },
    ]);
    // 2 locale x 1 item = 2 <url>.
    assert.equal((xml.match(/<url>/g) ?? []).length, 2);
    assert.ok(xml.includes(`<loc>${APP_URL}/id/words</loc>`));
    assert.ok(xml.includes(`<loc>${APP_URL}/id-SBS/words</loc>`));
    // Tiap URL membawa alternates kedua locale + x-default.
    assert.equal((xml.match(/hreflang="id"/g) ?? []).length, 2);
    assert.equal((xml.match(/hreflang="id-SBS"/g) ?? []).length, 2);
    assert.equal((xml.match(/hreflang="x-default"/g) ?? []).length, 2);
    assert.ok(xml.includes(`href="${APP_URL}/id/words"`));
  });

  it('lemma dengan karakter khusus lolos escaping', () => {
    const xml = buildUrlsetXml(APP_URL, [
      { bare: '/words/a&b<c', priority: '0.7', changefreq: 'weekly', lastmod: '2026-09-26' },
    ]);
    assert.ok(!xml.includes('/words/a&b<c<'));
    assert.ok(xml.includes('&amp;b&lt;c'));
  });
});

describe('buildSitemapIndexXml', () => {
  it('memuat 1 anak statis + 26 anak huruf dengan URL absolut', () => {
    const xml = buildSitemapIndexXml(APP_URL);
    assert.equal((xml.match(/<sitemap>/g) ?? []).length, 27);
    assert.ok(xml.includes(`<loc>${APP_URL}/sitemap-static.xml</loc>`));
    assert.ok(xml.includes(`<loc>${APP_URL}/sitemap-words/a</loc>`));
    assert.ok(xml.includes(`<loc>${APP_URL}/sitemap-words/z</loc>`));
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  });

  it('daftar huruf lengkap dan berurutan', () => {
    assert.deepEqual(SITEMAP_LETTERS[0], 'a');
    assert.deepEqual(SITEMAP_LETTERS[25], 'z');
    assert.equal(SITEMAP_LETTERS.length, 26);
  });
});
