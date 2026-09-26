/**
 * Pembangun RSS 2.0 (pure, tanpa import env) supaya bisa diuji node --test.
 * xmlEscape dipakai bersama dari utils/sitemap.
 */
import { xmlEscape } from './sitemap.ts';

export interface RssItem {
  title: string;
  /** Path item sudah ber-prefix locale, mis. '/id/words/capal'. */
  path: string;
  description: string;
  /** ISO 8601 dari API (approved_at). */
  publishedAt: string;
}

export interface RssChannel {
  title: string;
  description: string;
  /** Path kanal ber-prefix locale, mis. '/id'. */
  linkPath: string;
  language: string;
  lastBuildDate: string;
  items: RssItem[];
}

/** RFC 822 sesuai kebutuhan pubDate RSS: toUTCString sudah memenuhi. */
export function toRfc822(iso: string): string {
  return new Date(iso).toUTCString();
}

export function buildRssXml(appUrl: string, channel: RssChannel): string {
  const items = channel.items
    .map((item) => {
      const link = `${appUrl}${item.path}`;
      return `    <item>
      <title>${xmlEscape(item.title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <description>${xmlEscape(item.description)}</description>
      <pubDate>${toRfc822(item.publishedAt)}</pubDate>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(channel.title)}</title>
    <link>${xmlEscape(`${appUrl}${channel.linkPath}`)}</link>
    <description>${xmlEscape(channel.description)}</description>
    <language>${xmlEscape(channel.language)}</language>
    <lastBuildDate>${toRfc822(channel.lastBuildDate)}</lastBuildDate>
    <atom:link href="${xmlEscape(`${appUrl}/rss.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}
