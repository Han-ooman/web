/**
 * Registry locale web publik (sumber kebenaran).
 * Kontrak: docs/web/WEB-I18N.md
 */

/** Locale kanonik web (BCP-47 hyphen). */
export type AppLocale = 'id' | 'id-SBS';

export interface AppLocaleConfig {
  /** BCP-47 hyphen, kanonik di URL */
  code: AppLocale;
  /** Label di language switcher (bahasa itu sendiri) */
  label: string;
  /** Kode singkat di trigger header (ID, SBS) */
  shortLabel: string;
  /** Bahasa default situs */
  isDefault: boolean;
  /** Masuk sitemap + hreflang (prod) */
  seoIndex: boolean;
  /** Nilai og:locale (underscore) */
  ogLocale: string;
}

export const APP_LOCALES: readonly AppLocaleConfig[] = [
  {
    code: 'id',
    label: 'Bahasa Indonesia',
    shortLabel: 'ID',
    isDefault: true,
    seoIndex: true,
    ogLocale: 'id_ID',
  },
  {
    code: 'id-SBS',
    label: 'Bahasa Sambas',
    shortLabel: 'SBS',
    isDefault: false,
    seoIndex: true,
    ogLocale: 'id_SBS',
  },
];

export const DEFAULT_LOCALE: AppLocale = 'id';

export const LOCALE_COOKIE = 'sk_locale';

const byCode = new Map<string, AppLocaleConfig>(
  APP_LOCALES.map((l) => [l.code, l]),
);

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return !!value && byCode.has(value);
}

export function getLocaleConfig(code: AppLocale): AppLocaleConfig {
  return byCode.get(code)!;
}

export function seoLocales(): readonly AppLocaleConfig[] {
  return APP_LOCALES.filter((l) => l.seoIndex);
}

/**
 * Bangun path ber-prefix locale.
 * localePath('id', '/words') → '/id/words'
 * localePath('id', '/') → '/id'
 */
export function localePath(locale: AppLocale, path = '/', search = ''): string {
  const bare = path.startsWith('/') ? path : `/${path}`;
  const normalized = bare === '/' ? '' : bare.replace(/\/+$/, '');
  const qs =
    !search || search === '?'
      ? ''
      : search.startsWith('?')
        ? search
        : `?${search}`;
  return `/${locale}${normalized}${qs}`;
}

/** Path tanpa prefix locale, atau as-is jika tidak ber-locale. */
export function stripLocalePrefix(pathname: string): {
  locale: AppLocale | null;
  path: string;
} {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (first && isAppLocale(first)) {
    const rest = segments.slice(1);
    return {
      locale: first,
      path: rest.length === 0 ? '/' : `/${rest.join('/')}`,
    };
  }
  return { locale: null, path: pathname.startsWith('/') ? pathname : `/${pathname}` };
}

/** Ganti hanya segmen locale; pertahankan sisa path + query. */
export function swapLocalePath(
  pathname: string,
  search: string,
  nextLocale: AppLocale,
): string {
  const { path } = stripLocalePrefix(pathname);
  return localePath(nextLocale, path, search);
}
