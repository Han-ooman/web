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
import { Search, List, Home } from 'lucide-react';
import { ThemeToggle } from '../theme-toggle';

const NAV_ITEMS = [
  { to: '/', label: 'Beranda', icon: Home },
  { to: '/words', label: 'Daftar Kata A-Z', icon: List },
  { to: '/search', label: 'Cari', icon: Search },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpened, setMenuOpened] = useState(false);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const goTo = (to: string) => {
    setMenuOpened(false);
    navigate(to);
  };

  return (
    <Container size="md" h={60} px="md">
      <Group h={60} justify="space-between" wrap="nowrap">
        <Group gap="lg" wrap="nowrap">
          <Anchor
            component={Link}
            to="/"
            underline="never"
            fw={700}
            size="lg"
            c="var(--mantine-color-text)"
          >
            <Group gap="xs" wrap="nowrap">
              <Image src="/logo.png" alt="Logo SambasKu" h={32} w={32} fit="contain" />
              Sambasku
            </Group>
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
