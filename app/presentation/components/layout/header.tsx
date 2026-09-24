import { Suspense, lazy, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Anchor, Box, Burger, Container, Group, Image } from '@mantine/core';
import { Search, List, CircleHelp, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../theme-toggle';
import { Logo } from './logo';
import { LanguageSwitcher } from './language-switcher';
import { useLocalePath } from '@/application/i18n/use-locale';
import { stripLocalePrefix } from '@/application/i18n/locales';

const MobileDrawer = lazy(() => import('./mobile-drawer'));

export function Header() {
  const location = useLocation();
  const [menuOpened, setMenuOpened] = useState(false);
  const { t } = useTranslation();
  const lp = useLocalePath();

  const navItems = [
    { to: lp('/words'), bare: '/words', label: t('nav_words'), icon: List },
    { to: lp('/search'), bare: '/search', label: t('nav_search'), icon: Search },
    {
      to: lp('/bantuan-terjemahan'),
      bare: '/bantuan-terjemahan',
      label: t('nav_ask'),
      icon: Languages,
    },
    { to: lp('/faq'), bare: '/faq', label: t('nav_faq'), icon: CircleHelp },
  ];

  const isActive = (bare: string) => {
    const { path } = stripLocalePrefix(location.pathname);
    return path === bare || path.startsWith(`${bare}/`);
  };

  return (
    <Container size="md" h={60} px="md">
      <Group h={60} justify="space-between" wrap="nowrap">
        <Group gap="lg" wrap="nowrap">
          <Anchor
            component={Link}
            to={lp('/')}
            underline="never"
            aria-label={t('nav_homeAria')}
          >
            <Logo h={40} eager />
          </Anchor>

          <Group gap={4} visibleFrom="xs">
            {navItems.map((item) => (
              <Anchor
                key={item.bare}
                component={Link}
                to={item.to}
                underline="never"
                size="sm"
                fw={isActive(item.bare) ? 600 : 400}
                c={isActive(item.bare) ? 'var(--mantine-color-text)' : 'dimmed'}
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
          <LanguageSwitcher />
          <Anchor
            href="https://play.google.com/store/apps/details?id=com.iamutaki.sambasku"
            target="_blank"
            rel="noopener noreferrer"
            underline="never"
            visibleFrom="xs"
            aria-label={t('common_getAppAria')}
          >
            <Image
              src="/google_play.webp"
              alt={t('common_getOnGooglePlay')}
              h={36}
              w="auto"
              fit="contain"
              decoding="async"
            />
          </Anchor>
          <ThemeToggle />
          <Box hiddenFrom="xs">
            <Burger
              opened={menuOpened}
              onClick={() => setMenuOpened((v) => !v)}
              aria-label={t('nav_openMenu')}
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
