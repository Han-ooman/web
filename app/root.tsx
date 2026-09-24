import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
  useParams,
} from 'react-router';
import {
  Button,
  ColorSchemeScript,
  MantineProvider,
  Stack,
  Text,
  ThemeIcon,
  Title,
  createTheme,
  mantineHtmlProps,
} from '@mantine/core';
import { Home, AlertCircle, RefreshCw } from 'lucide-react';
import type { Route } from './+types/root';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import './presentation/styles/app.css';

const theme = createTheme({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  headings: { fontFamily: "'Plus Jakarta Sans', sans-serif" },
});

export const links: Route.LinksFunction = () => [
  { rel: 'icon', href: '/favicon-192.png', type: 'image/png', sizes: '192x192' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
  {
    rel: 'preload',
    href: '/fonts/pjs-latin-var.woff2',
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const lang = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;

  return (
    <html lang={lang} {...mantineHtmlProps} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          {children}
        </MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const params = useParams();
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);

  let message = t('errors_generic');
  let details = t('errors_genericDetail');
  let is404 = false;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      is404 = true;
      message = t('errors_notFoundTitle');
      details = t('errors_notFoundDetail');
    } else {
      message = t('errors_errorStatus', { status: error.status });
      details = error.statusText || details;
    }
  } else if (error instanceof Error) {
    details = error.message;
  }

  return (
    <Stack
      align="center"
      justify="center"
      gap="md"
      mih="60vh"
      px="md"
      py={80}
      ta="center"
    >
      <ThemeIcon size={56} variant="light" color="red" radius="xl">
        <AlertCircle size={28} />
      </ThemeIcon>
      <Title order={2} size="h2">
        {message}
      </Title>
      <Text c="dimmed" size="sm" maw={420}>
        {details}
      </Text>

      <Stack align="center" gap="sm" mt="md">
        <Button
          component={Link}
          to={localePath(locale, '/')}
          leftSection={<Home size={16} />}
          variant="light"
        >
          {t('common_backHome')}
        </Button>
        {!is404 && (
          <Button
            variant="default"
            onClick={() => window.location.reload()}
            leftSection={<RefreshCw size={16} />}
          >
            {t('common_reload')}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
