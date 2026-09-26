import { listWordsAtoZ } from '../application/use-cases/word.use-case';
import { env } from '../infrastructure/config/env';

/**
 * Dump Markdown korpus terverifikasi untuk agen AI.
 * Gloss dari GET /words?is_verified=true (bukan N+1 detail).
 */
const PAGE_SIZE = 100;
const MAX_PAGES = 40;

export async function loader() {
  if (!env.isProd) {
    throw new Response('Not Found', { status: 404 });
  }

  const lines: string[] = [
    '# SambasKu - korpus terverifikasi',
    '>',
    '> Lemma published + is_verified. Gloss singkat dari daftar A-Z.',
    '> Detail penuh: GET https://api.sambasku.com/api/v1/words/lemma/{lemma}',
    '> Dokumentasi: https://sambasku.com/id/api-publik',
    '>',
    '> Kutipan bebas dengan tautan ke halaman kata di sambasku.com.',
    '',
  ];

  try {
    let cursor: string | undefined;
    let total = 0;
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await listWordsAtoZ({
        isVerified: true,
        limit: PAGE_SIZE,
        cursor,
      });
      for (const word of res.data) {
        total += 1;
        lines.push(`## ${word.lemma}`);
        if (word.sense) lines.push(`- gloss: ${word.sense}`);
        lines.push(`- url: ${env.appUrl}/id/words/${encodeURIComponent(word.lemma)}`);
        lines.push(
          `- api: https://api.sambasku.com/api/v1/words/lemma/${encodeURIComponent(word.lemma)}`,
        );
        lines.push('');
      }
      const next = res.meta?.next_cursor ?? null;
      if (!res.meta?.has_more || !next) break;
      if (page === MAX_PAGES - 1) {
        return new Response('Service Unavailable', {
          status: 503,
          headers: { 'Cache-Control': 'no-store', 'Retry-After': '600' },
        });
      }
      cursor = next;
    }
    lines.splice(1, 0, `> Entri: ${total}`);
  } catch (err) {
    console.error('[llms-full] gagal mengambil daftar kata', err);
    return new Response('Service Unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '600' },
    });
  }

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
