import {
  Box,
  Group,
  Menu,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { Check, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  APP_LOCALES,
  getLocaleConfig,
  type AppLocale,
  swapLocalePath,
} from '@/application/i18n/locales';
import { useLocale } from '@/application/i18n/use-locale';

function useLocaleSwitch() {
  const locale = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const current = getLocaleConfig(locale);

  const onSelect = (next: AppLocale) => {
    if (next === locale) return;
    navigate(swapLocalePath(location.pathname, location.search, next));
  };

  return { locale, current, onSelect };
}

/** Trigger header: tinggi sama ThemeToggle, lebar ikut label (ID/SBS). */
export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { locale, current, onSelect } = useLocaleSwitch();

  return (
    <Menu shadow="md" width={240} position="bottom-end" offset={6}>
      <Menu.Target>
        <Tooltip label={t('nav_languageSwitcher')} position="bottom-end">
          <UnstyledButton
            aria-label={t('nav_languageSwitcher')}
            aria-haspopup="menu"
            px={10}
            style={{
              height: 36,
              minWidth: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--mantine-radius-default)',
              border: '1px solid var(--mantine-color-default-border)',
              background: 'var(--mantine-color-default)',
              color: 'var(--mantine-color-text)',
            }}
          >
            <Group gap={4} wrap="nowrap" justify="center">
              <Text
                size="xs"
                fw={700}
                ff="var(--mantine-font-family-headings)"
                style={{ letterSpacing: '0.04em', lineHeight: 1, whiteSpace: 'nowrap' }}
              >
                {current.shortLabel}
              </Text>
              <ChevronDown size={12} strokeWidth={2.25} opacity={0.65} />
            </Group>
          </UnstyledButton>
        </Tooltip>
      </Menu.Target>

      <Menu.Dropdown p={6}>
        <Text size="xs" c="dimmed" px={8} pt={4} pb={6} fw={500}>
          {t('nav_languageSwitcher')}
        </Text>
        <Stack gap={4}>
          {APP_LOCALES.map((item) => {
            const selected = item.code === locale;
            return (
              <Menu.Item
                key={item.code}
                onClick={() => onSelect(item.code)}
                closeMenuOnClick
                p={0}
                style={{ background: 'transparent' }}
              >
                <Box
                  px={10}
                  py={8}
                  style={{
                    borderRadius: 'var(--mantine-radius-sm)',
                    background: selected
                      ? 'var(--mantine-color-default-hover)'
                      : undefined,
                    border: selected
                      ? '1px solid var(--mantine-color-default-border)'
                      : '1px solid transparent',
                  }}
                >
                  <Group justify="space-between" wrap="nowrap" gap="sm">
                    <Group gap={10} wrap="nowrap">
                      <Box
                        w={36}
                        h={28}
                        style={{
                          borderRadius: 6,
                          display: 'grid',
                          placeItems: 'center',
                          background: selected
                            ? 'var(--mantine-color-blue-light)'
                            : 'var(--mantine-color-default)',
                          border: '1px solid var(--mantine-color-default-border)',
                        }}
                      >
                        <Text
                          size="xs"
                          fw={700}
                          c={selected ? 'blue' : undefined}
                          style={{ letterSpacing: '0.04em', lineHeight: 1 }}
                        >
                          {item.shortLabel}
                        </Text>
                      </Box>
                      <Stack gap={0}>
                        <Text size="sm" fw={selected ? 600 : 500} lh={1.3}>
                          {item.label}
                        </Text>
                        <Text size="xs" c="dimmed" lh={1.3}>
                          {item.code}
                        </Text>
                      </Stack>
                    </Group>
                    {selected ? (
                      <Check size={16} strokeWidth={2.25} color="var(--mantine-color-blue-filled)" />
                    ) : (
                      <Box w={16} />
                    )}
                  </Group>
                </Box>
              </Menu.Item>
            );
          })}
        </Stack>
      </Menu.Dropdown>
    </Menu>
  );
}

/**
 * Picker penuh di drawer mobile: daftar tap, bukan Menu kecil yang
 * terasa menempel di pojok.
 */
export function LanguageSwitcherPanel({ onPicked }: { onPicked?: () => void }) {
  const { t } = useTranslation();
  const { locale, onSelect } = useLocaleSwitch();

  return (
    <Stack gap={6}>
      <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: '0.06em' }}>
        {t('nav_language')}
      </Text>
      <Stack gap={6}>
        {APP_LOCALES.map((item) => {
          const selected = item.code === locale;
          return (
            <UnstyledButton
              key={item.code}
              aria-pressed={selected}
              aria-label={item.label}
              onClick={() => {
                onSelect(item.code);
                onPicked?.();
              }}
              p={12}
              style={{
                borderRadius: 'var(--mantine-radius-md)',
                border: selected
                  ? '1px solid var(--mantine-color-blue-filled)'
                  : '1px solid var(--mantine-color-default-border)',
                background: selected
                  ? 'var(--mantine-color-blue-light)'
                  : 'var(--mantine-color-body)',
              }}
            >
              <Group justify="space-between" wrap="nowrap">
                <Group gap={12} wrap="nowrap">
                  <Box
                    w={40}
                    h={32}
                    style={{
                      borderRadius: 8,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'var(--mantine-color-body)',
                      border: '1px solid var(--mantine-color-default-border)',
                    }}
                  >
                    <Text size="sm" fw={700} style={{ letterSpacing: '0.04em' }}>
                      {item.shortLabel}
                    </Text>
                  </Box>
                  <Text size="sm" fw={selected ? 600 : 500}>
                    {item.label}
                  </Text>
                </Group>
                {selected ? (
                  <Check size={18} color="var(--mantine-color-blue-filled)" />
                ) : null}
              </Group>
            </UnstyledButton>
          );
        })}
      </Stack>
    </Stack>
  );
}
