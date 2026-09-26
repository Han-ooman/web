import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildRssXml, toRfc822 } from './rss.ts';

const APP_URL = 'https://sambasku.com';

describe('toRfc822', () => {
  it('menghasilkan bentuk RFC 822 dengan zona GMT', () => {
    assert.match(toRfc822('2026-09-25T08:00:00Z'), /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/);
  });
});

describe('buildRssXml', () => {
  const channel = {
    title: 'Kata Terbaru Kamus Sambas',
    description: 'Kata yang baru disetujui dan tayang.',
    linkPath: '/id',
    language: 'id',
    lastBuildDate: '2026-09-25T08:00:00Z',
    items: [
      {
        title: 'capal',
        path: '/id/words/capal',
        description: 'sandal terbuat dari karet',
        publishedAt: '2026-09-25T08:00:00Z',
      },
      {
        title: 'a&b<c',
        path: '/id/words/a%26b',
        description: "makna dengan 'kutip' & \"petik\"",
        publishedAt: '2026-09-24T08:00:00Z',
      },
    ],
  };

  const xml = buildRssXml(APP_URL, channel);

  it('struktur dasar channel + self link atom', () => {
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xml.includes('<rss version="2.0"'));
    assert.ok(
      xml.includes(`href="${APP_URL}/rss.xml" rel="self" type="application/rss+xml"`),
    );
    assert.ok(xml.includes(`<link>${APP_URL}/id</link>`));
  });

  it('item memuat guid permanen, pubDate, dan URL absolut', () => {
    assert.ok(xml.includes(`<link>${APP_URL}/id/words/capal</link>`));
    assert.ok(
      xml.includes('<guid isPermaLink="true">https://sambasku.com/id/words/capal</guid>'),
    );
    assert.ok(xml.includes('<pubDate>Fri, 25 Sep 2026 08:00:00 GMT</pubDate>'));
  });

  it('judul dan deskripsi dengan karakter khusus di-escape', () => {
    assert.ok(xml.includes('<title>a&amp;b&lt;c</title>'));
    assert.ok(!xml.includes("'kutip' & \"petik\""));
    assert.ok(xml.includes('&apos;kutip&apos;'));
  });
});
