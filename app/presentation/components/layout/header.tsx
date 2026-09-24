import { Suspense, lazy, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Anchor, Box, Burger, Container, Group, Image } from '@mantine/core';
import { Search, List, CircleHelp, Languages } from 'lucide-react';
import { ThemeToggle } from '../theme-toggle';
import { Logo } from './logo';

// ponytail: Drawer di-split biar kode Mantine Drawer keluar dari chunk
// pertama; NAV_ITEMS sengaja duplikat di mobile-drawer.tsx (import bersama
// akan menarik chunk-nya masuk lagi).
const MobileDrawer = lazy(() => import('./mobile-drawer'));

const NAV_ITEMS = [
  { to: '/words', label: 'Daftar Kata A-Z', icon: List },
  { to: '/search', label: 'Cari', icon: Search },
  { to: '/bantuan-terjemahan', label: 'Bantuan', icon: Languages },
  { to: '/faq', label: 'FAQ', icon: CircleHelp },
];

export function Header() {
  const location = useLocation();
  const [menuOpened, setMenuOpened] = useState(false);

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <Container size="md" h={60} px="md">
      <Group h={60} justify="space-between" wrap="nowrap">
        <Group gap="lg" wrap="nowrap">
          {/* Teks "SambasKu" cukup di SEO (title/og:site_name) dan alt gambar.
              Logo = tombol Beranda. */}
          <Anchor component={Link} to="/" underline="never" aria-label="SambasKu">
            <Logo h={40} eager />
          </Anchor>

          {/* Navigasi desktop */}
          <Group gap={4} visibleFrom="xs">
            {NAV_ITEMS.map((item) => (
              <Anchor
                key={item.to}
                component={Link}
                to={item.to}
                underline="never"
                size="sm"
                fw={isActive(item.to) ? 600 : 400}
                c={isActive(item.to) ? 'var(--mantine-color-text)' : 'dimmed'}
                px={8}
                py={4}
                style={{ borderRadius: 'var(--mantine-radius-sm)' }}
              >
                <Group gap={6} wrap="nowrap">
                  <item.icon size={15} />
                  {item.label}
                </Group>
              </Anchor>
            ))}
          </Group>
        </Group>

        <Group gap="xs" wrap="nowrap">
          {/* CTA Play Store - disembunyikan di layar sangat kecil biar tidak
              berdesakan dengan toggle tema + burger. */}
          <Anchor
            href="https://play.google.com/store/apps/details?id=com.iamutaki.sambasku"
            target="_blank"
            rel="noopener noreferrer"
            underline="never"
            visibleFrom="xs"
            aria-label="Dapatkan aplikasi SambasKu di Google Play"
          >
            <Image
              src="/google_play.webp"
              alt="Dapatkan di Google Play"
              h={36}
              w="auto"
              fit="contain"
              decoding="async"
            />
          </Anchor>
          <ThemeToggle />
          {/* Menu mobile */}
          <Box hiddenFrom="xs">
            <Burger
              opened={menuOpened}
              onClick={() => setMenuOpened((v) => !v)}
              aria-label="Buka menu navigasi"
              size="sm"
            />
          </Box>
        </Group>
      </Group>

      {menuOpened && (
        <Suspense fallback={null}>
          <MobileDrawer opened={menuOpened} onClose={() => setMenuOpened(false)} />
        </Suspense>
      )}
    </Container>
  );
}
