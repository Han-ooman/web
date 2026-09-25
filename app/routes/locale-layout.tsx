import { useMemo, useSyncExternalStore } from 'react';
import { data, Outlet, useLoaderData } from 'react-router';
import { AppShell } from '@mantine/core';
import { I18nextProvider } from 'react-i18next';
import type { Route } from './+types/locale-layout';
import { createI18nInstance } from '@/application/i18n/i18n-instance';
import { getClientI18n } from '@/application/i18n/i18n.client';
import { isAppLocale, type AppLocale } from '@/application/i18n/locales';
import {
  localeCookieHeader,
  localeCookieValue,
} from '@/application/i18n/resolve-preferred-locale';
import { Header } from '@/presentation/components/layout/header';
import { Footer } from '@/presentation/components/layout/footer';
import { RouteProgressBar } from '@/presentation/components/route-progress-bar';

export async function loader({ params, request }: Route.LoaderArgs) {
  const raw = params.locale;
  if (!isAppLocale(raw)) {
    throw new Response('Not Found', { status: 404 });
  }
  const locale: AppLocale = raw;
  // Set-Cookie hanya untuk visitor baru / yang berganti locale (pentest G-01):
  // respons ber-Set-Cookie tidak pernah tersimpan di Cache API, dan visitor
  // lama yang menetap di satu locale tidak butuh cookie diset ulang tiap
  // request.
  return data(
    { locale },
    localeCookieValue(request) === locale
      ? undefined
      : {
          headers: {
            'Set-Cookie': localeCookieHeader(locale),
          },
        },
  );
}

function subscribeNoop() {
  return () => {};
}

/** false saat SSR/hidrasi, true setelahnya - tanpa setState di effect. */
function useIsClient() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

export default function LocaleLayout() {
  const { locale } = useLoaderData<typeof loader>();
  const isClient = useIsClient();

  const i18n = useMemo(() => {
    if (isClient) return getClientI18n(locale);
    return createI18nInstance(locale);
  }, [locale, isClient]);

  return (
    <I18nextProvider i18n={i18n}>
      {/* Footer di luar AppShell: AppShell.Footer Mantine v9 fixed
          by default (menutupi konten) dan tanpa opsi non-fixed. */}
      <AppShell header={{ height: 60 }} padding={0}>
        <AppShell.Header>
          <Header />
        </AppShell.Header>
        <RouteProgressBar />
        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>
      <Footer />
    </I18nextProvider>
  );
}
