import type { Route } from './+types/og.words[.]png';
import { ImageResponse } from 'workers-og';
import { getWordByLemma } from '../application/use-cases/word.use-case';
import { buildWordSeoCopy } from '../application/utils/seo';
import { env } from '../infrastructure/config/env';
import { DEFAULT_LOCALE } from '@/application/i18n/locales';

/**
 * Kartu OG dinamis per kata: /og/words/{lemma} (Content-Type image/png).
 *
 * GERBANG SEBELUM PROD: render PNG resvg memakan CPU Worker jauh di atas
 * jendela ~10 ms paket gratis. Ukur dulu di staging (wrangler tail, cari
 * `Exceeded CPU`) sebelum mengaktifkan; kalau gagal, naikkan plan Workers
 * atau putuskan fase ini (fallback logo.png tetap dipakai meta).
 * Edge cache menutup biaya render setelah hit pertama per deploy.
 */

/** Batas aman segmen lemma di URL (guard murah sebelum subrequest API). */
const LEMMA_PATH_RE = /^[A-Za-z0-9%._~-]{1,100}$/;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Potong deskripsi agar muat dua baris kartu (satori tak punya line-clamp). */
function clampText(text: string, max = 140): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function buildCardHtml(lemma: string, description: string): string {
  // satori: setiap div ber-anak WAJIB display:flex eksplisit.
  return `<div style="display:flex;flex-direction:column;justify-content:space-between;width:1200px;height:630px;background:#101826;padding:72px 88px;font-family:sans-serif;">
  <div style="display:flex;align-items:center;gap:16px;">
    <div style="display:flex;width:18px;height:18px;border-radius:6px;background:#228be6;"></div>
    <div style="display:flex;color:#a5b4cf;font-size:30px;font-weight:600;">Kamus Sambas</div>
  </div>
  <div style="display:flex;flex-direction:column;gap:24px;">
    <div style="display:flex;color:#ffffff;font-size:96px;font-weight:800;line-height:1.1;">${escapeHtml(lemma)}</div>
    <div style="display:flex;color:#c3cfe6;font-size:34px;line-height:1.4;">${escapeHtml(clampText(description))}</div>
  </div>
</div>`;
}

export async function loader({ params }: Route.LoaderArgs) {
  if (!env.isProd) {
    throw new Response('Not Found', { status: 404 });
  }
  const lemma = params.lemma ?? '';
  if (!LEMMA_PATH_RE.test(lemma)) {
    throw new Response('Not Found', { status: 404 });
  }

  let word;
  try {
    word = await getWordByLemma(lemma);
  } catch {
    // Kata tak ditemukan: 404 (di-negative-cache oleh cache-policy).
    throw new Response('Not Found', { status: 404 });
  }

  const { description } = buildWordSeoCopy(word, DEFAULT_LOCALE);
  // Buffer ke Uint8Array, jangan kembalikan stream-nya: pipeline worker
  // (clone + re-wrap body) memutus stream lazy buatan ImageResponse
  // sehingga body sampai kosong (terverifikasi lokal wrangler dev).
  let pngBuffer: ArrayBuffer;
  try {
    const png = new ImageResponse(buildCardHtml(word.lemma, description), {
      width: 1200,
      height: 630,
    });
    pngBuffer = await png.arrayBuffer();
  } catch (err) {
    console.error('[og] gagal render kartu', err);
    throw new Response('Not Found', { status: 404 });
  }
  return new Response(pngBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
