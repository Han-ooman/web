import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  Anchor,
  Box,
  Burger,
  Container,
  Drawer,
  Group,
  Image,
  Stack,
} from '@mantine/core';
import { Search, List } from 'lucide-react';
import { ThemeToggle } from '../theme-toggle';
import { Logo } from './logo';

// Logo di appbar = tombol Beranda (link ke /)
const NAV_ITEMS = [
  { to: '/words', label: 'Daftar Kata A-Z', icon: List },
  { to: '/search', label: 'Cari', icon: Search },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpened, setMenuOpened] = useState(false);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const goTo = (to: string) => {
    setMenuOpened(false);
    navigate(to);
  };

  return (
    <Container size="md" h={60} px="md">
      <Group h={60} justify="space-between" wrap="nowrap">
        <Group gap="lg" wrap="nowrap">
          {/* Teks "SambasKu" cukup di SEO (title/og:site_name) dan alt gambar */}
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
              berdesakan dengan toggle tema + burger (footer kandidat pengganti). */}
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

      <Drawer
        opened={menuOpened}
        onClose={() => setMenuOpened(false)}
        title="Menu"
        padding="md"
        size="xs"
        position="right"
      >
        <Stack gap="xs">
          {NAV_ITEMS.map((item) => (
            <Anchor
              key={item.to}
              component="button"
              type="button"
              onClick={() => goTo(item.to)}
              underline="never"
              size="md"
              fw={isActive(item.to) ? 600 : 400}
              c={isActive(item.to) ? 'var(--mantine-color-text)' : 'dimmed'}
              px="sm"
              py="xs"
              style={{ borderRadius: 'var(--mantine-radius-sm)', textAlign: 'left' }}
            >
              <Group gap="sm">
                <item.icon size={18} />
                {item.label}
              </Group>
            </Anchor>
          ))}
        </Stack>
      </Drawer>
    </Container>
  );
}
