import { useEffect, useMemo, useState } from 'react';
import { data, Outlet, useLoaderData } from 'react-router';
import { AppShell } from '@mantine/core';
import { I18nextProvider } from 'react-i18next';
import type { Route } from './+types/locale-layout';
import { createI18nInstance } from '@/application/i18n/i18n-instance';
import { getClientI18n } from '@/application/i18n/i18n.client';
import { isAppLocale, type AppLocale } from '@/application/i18n/locales';
import { localeCookieHeader } from '@/application/i18n/resolve-preferred-locale';
import { Header } from '@/presentation/components/layout/header';
import { Footer } from '@/presentation/components/layout/footer';
import { RouteProgressBar } from '@/presentation/components/route-progress-bar';

export async function loader({ params }: Route.LoaderArgs) {
  const raw = params.locale;
  if (!isAppLocale(raw)) {
    throw new Response('Not Found', { status: 404 });
  }
  const locale: AppLocale = raw;
  return data(
    { locale },
    {
      headers: {
        'Set-Cookie': localeCookieHeader(locale),
      },
    },
  );
}

export default function LocaleLayout() {
  const { locale } = useLoaderData<typeof loader>();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const i18n = useMemo(() => {
    if (isClient) return getClientI18n(locale);
    return createI18nInstance(locale);
  }, [locale, isClient]);

  useEffect(() => {
    if (isClient) getClientI18n(locale);
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
