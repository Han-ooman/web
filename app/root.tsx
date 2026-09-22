import '@mantine/core/styles.css';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
} from 'react-router';
import {
  AppShell,
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
import { Header } from './presentation/components/layout/header';
import { Footer } from './presentation/components/layout/footer';
import { RouteProgressBar } from './presentation/components/route-progress-bar';
import './presentation/styles/app.css';

const theme = createTheme({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  headings: { fontFamily: "'Plus Jakarta Sans', sans-serif" },
});

export const links: Route.LinksFunction = () => [
  { rel: 'icon', href: '/logo.png', type: 'image/png' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400..800;1,400..800&display=swap',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" {...mantineHtmlProps} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          {/* Footer di luar AppShell: AppShell.Footer Mantine v9 fixed
              by default (menutupi konten) dan tanpa opsi non-fixed. */}
          <AppShell header={{ height: 60 }} padding={0}>
            <AppShell.Header>
              <Header />
            </AppShell.Header>
            <RouteProgressBar />
            <AppShell.Main>{children}</AppShell.Main>
          </AppShell>
          <Footer />
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
  let message = 'Terjadi kesalahan pada sistem.';
  let details = 'Mohon coba beberapa saat lagi.';
  let is404 = false;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      is404 = true;
      message = 'Halaman Tidak Ditemukan (404)';
      details =
        'Kosakata atau tautan yang kamu tuju belum tersedia atau telah dipindahkan.';
    } else {
      message = `Error ${error.status}`;
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
          to="/"
          leftSection={<Home size={16} />}
          variant="light"
        >
          Kembali ke Beranda
        </Button>
        {!is404 && (
          <Button
            variant="default"
            onClick={() => window.location.reload()}
            leftSection={<RefreshCw size={16} />}
          >
            Muat Ulang
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
