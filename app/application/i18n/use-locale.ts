import { useMemo } from 'react';
import { useParams, useRouteLoaderData } from 'react-router';
import {
  DEFAULT_LOCALE,
  type AppLocale,
  isAppLocale,
  localePath,
} from './locales';

interface LocaleLayoutData {
  locale: AppLocale;
}

/** Locale aktif dari layout `/:locale` (fallback default). */
export function useLocale(): AppLocale {
  const data = useRouteLoaderData('routes/locale-layout') as
    | LocaleLayoutData
    | undefined;
  const params = useParams();

  if (data?.locale && isAppLocale(data.locale)) return data.locale;
  if (isAppLocale(params.locale)) return params.locale;
  return DEFAULT_LOCALE;
}

/** Helper path ber-locale untuk Link/navigate. */
export function useLocalePath() {
  const locale = useLocale();
  return useMemo(
    () => (path?: string, search?: string) => localePath(locale, path ?? '/', search),
    [locale],
  );
}
