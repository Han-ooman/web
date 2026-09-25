import { isAppLocale } from '../i18n/locales.ts';

/** Kartu PNG dinamis `/og/words/:lemma` selalu digambar di ukuran ini. */
export const OG_CARD_WIDTH = 1200;
export const OG_CARD_HEIGHT = 630;
/** `public/logo.png`, fallback og:image kalau halaman tidak punya gambar. */
export const LOGO_OG_SIZE = 512;

/**
 * Dimensi yang boleh diumumkan ke unfurler. Pasangan width+height saja;
 * salah satu tanpa yang lain bikin WhatsApp/Telegram mengukur ulang juga.
 */
export function resolveOgImageSize(
  image: string | undefined,
  finalImage: string,
  imageWidth?: number,
  imageHeight?: number,
): { width: number; height: number } | null {
  if (imageWidth != null && imageHeight != null) {
    return { width: imageWidth, height: imageHeight };
  }
  if (!image) return { width: LOGO_OG_SIZE, height: LOGO_OG_SIZE };
  let pathname = finalImage;
  try {
    pathname = new URL(finalImage, 'https://sambasku.local').pathname;
  } catch {
    return null;
  }
  if (/^\/og\/words\/[^/]+$/.test(pathname)) {
    return { width: OG_CARD_WIDTH, height: OG_CARD_HEIGHT };
  }
  return null;
}

/** Lemma dari path ber-locale `/id/words/:lemma`, untuk alt kartu OG. */
export function lemmaAltFromLocalizedPath(localizedPath: string): string | null {
  const clean = localizedPath.split('?')[0] || '/';
  const segments = clean.split('/').filter(Boolean);
  const rest =
    segments[0] && isAppLocale(segments[0]) ? segments.slice(1) : segments;
  if (rest.length !== 2 || rest[0] !== 'words' || !rest[1]) return null;
  try {
    return decodeURIComponent(rest[1]);
  } catch {
    return rest[1];
  }
}
