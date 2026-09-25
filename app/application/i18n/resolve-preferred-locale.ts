/**
 * Resolve locale preferensi untuk redirect dari `/`.
 * Urutan: cookie sk_locale → Accept-Language (best-effort) → default.
 */
import {
  APP_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  type AppLocale,
  isAppLocale,
} from './locales';

function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('=') || '');
  }
  return null;
}

function fromAcceptLanguage(header: string | null): AppLocale | null {
  if (!header) return null;
  const tags = header.split(',').map((p) => p.trim().split(';')[0]?.trim());
  for (const tag of tags) {
    if (!tag) continue;
    if (isAppLocale(tag)) return tag;
    // id-ID / id_ID → id
    const primary = tag.split(/[-_]/)[0]?.toLowerCase();
    if (primary === 'id') return 'id' as AppLocale;
  }
  // Jangan map "sambas" spekulatif dari Accept-Language.
  void APP_LOCALES;
  return null;
}

export function resolvePreferredLocale(request: Request): AppLocale {
  const cookie = parseCookie(request.headers.get('Cookie'), LOCALE_COOKIE);
  if (isAppLocale(cookie)) return cookie;

  const fromHeader = fromAcceptLanguage(request.headers.get('Accept-Language'));
  if (fromHeader) return fromHeader;

  return DEFAULT_LOCALE;
}

/// Nilai cookie sk_locale request, null jika belum ada (pentest G-01:
/// loader locale-layout memakai ini untuk menghindari Set-Cookie yang
/// tidak perlu pada visitor lama).
export function localeCookieValue(request: Request): string | null {
  return parseCookie(request.headers.get('Cookie'), LOCALE_COOKIE);
}

export function localeCookieHeader(locale: AppLocale): string {
  // 1 tahun; SameSite=Lax. HttpOnly+Secure: nilai cookie ini tidak pernah
  // dibaca JavaScript (resolve dilakukan server-side), jadi tidak ada alasan
  // mengeksposnya (pentest B-09).
  return `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure; HttpOnly`;
}
