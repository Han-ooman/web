import { Link } from 'react-router';
import { Anchor, Container, Divider, Group, Stack, Text } from '@mantine/core';
import { Heart, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Logo } from './logo';
import { useLocalePath } from '@/application/i18n/use-locale';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();
    const lp = useLocalePath();

  return (
    <Container size="md" py="md">
      <Group justify="space-between" gap="md">
        <Group gap="xs" justify="center">
          <Logo h={28} />
          <Text size="sm" c="dimmed">
            {t('common_tagline')}
          </Text>
        </Group>

        <Group gap="lg" justify="center">
          <Anchor component={Link} to={lp('/words')} size="xs" c="dimmed" py={4}>
            {t('nav_words')}
          </Anchor>
          <Anchor component={Link} to={lp('/faq')} size="xs" c="dimmed" py={4}>
            {t('nav_faq')}
          </Anchor>
          <Anchor
            component={Link}
            to={lp('/privacy-policy')}
            size="xs"
            c="dimmed"
            py={4}
          >
            {t('nav_privacy')}
          </Anchor>
          <Anchor component={Link} to={lp('/search')} size="xs" c="dimmed" py={4}>
            {t('nav_searchFull')}
          </Anchor>
          <Anchor
            href="https://github.com/sambasku"
            target="_blank"
            rel="noreferrer"
            size="xs"
            c="dimmed"
          >
            <Group gap={4} wrap="nowrap">
              <ExternalLink size={13} />
              {t('nav_github')}
            </Group>
          </Anchor>
        </Group>
      </Group>

      <Divider my="sm" />

      <Stack gap={4} align="center">
        <Text size="xs" c="dimmed" ta="center">
          {t('common_copyright', { year: currentYear })}
          {' · '}
          <Anchor component={Link} to={lp('/hapus-akun')} size="xs" c="dimmed">
            {t('common_deleteAccount')}
          </Anchor>
        </Text>
        <Group gap={4} wrap="nowrap">
          <Text size="xs" c="dimmed">
            {t('common_madeWith')}
          </Text>
          <Heart
            size={12}
            color="var(--mantine-color-red-5)"
            fill="var(--mantine-color-red-5)"
          />
          <Text size="xs" c="dimmed">
            {t('common_forLanguagePreservation')}
          </Text>
        </Group>
      </Stack>
    </Container>
  );
}
