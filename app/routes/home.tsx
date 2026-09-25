import { Link, useLoaderData } from 'react-router';
import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Sparkles, PlusCircle, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/home';
import { getWordOfDay } from '../application/use-cases/word.use-case';
import { buildHomeJsonLd, buildMetaTags } from '../application/utils/seo';
import { env } from '../infrastructure/config/env';
import { SearchBar } from '../presentation/components/word/search-bar';
import { WordOfTheDayCard } from '../presentation/components/word/word-of-the-day-card';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { useLocalePath } from '@/application/i18n/use-locale';

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  return [
    ...buildMetaTags({
      title: t('seo_homeTitle'),
      description: t('seo_homeDescription'),
      path: localePath(locale, '/'),
      locale,
    }),
    ...(env.isProd ? [{ 'script:ld+json': buildHomeJsonLd(locale) }] : []),
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const wordOfDay = await getWordOfDay(request.signal);
  return { wordOfDay };
}

const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.iamutaki.sambasku';
const WHATSAPP_GROUP_URL =
  'https://chat.whatsapp.com/Kw64lxFEGXfK5gw6T6GEoN?mode=gi_t';

export default function Home() {
  const { wordOfDay } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
    const lp = useLocalePath();

  return (
    <Container size="md" py={44}>
      <Stack gap={44}>
        <Stack align="center" gap="md" maw={640} mx="auto" pt="sm">
          <Badge
            variant="light"
            color="amber"
            leftSection={<Sparkles size={13} />}
            size="sm"
          >
            {t('home_badge')}
          </Badge>

          <Title order={1} ta="center" fw={800}>
            {t('home_title')}
          </Title>

          <Text c="dimmed" size="lg" ta="center" maw={560}>
            {t('home_subtitle')}
          </Text>

          <SearchBar autoFocus />
        </Stack>

        {wordOfDay.word && (
          <Stack gap="xs">
            <Title order={2} size="h5" c="dimmed" tt="uppercase" fw={600}>
              {t('home_wotdHeading')}
            </Title>
            <WordOfTheDayCard wordOfDay={wordOfDay} />
          </Stack>
        )}

        <Stack gap="sm">
          <Group justify="space-between">
            <Title order={2} size="h5" c="dimmed" tt="uppercase" fw={600}>
              {t('home_azHeading')}
            </Title>
            <Anchor component={Link} to={lp('/words')} size="xs" c="dimmed" py={4}>
              {t('home_viewAllWords')}
            </Anchor>
          </Group>

          <Group gap="xs">
            {ALPHABETS.map((letter) => (
              <ActionIcon
                key={letter}
                component={Link}
                to={lp('/words', `?q=${letter}`)}
                variant="default"
                size="input-lg"
                radius="sm"
                fw={500}
              >
                {letter}
              </ActionIcon>
            ))}
          </Group>
        </Stack>

        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between" align="center" gap="lg" wrap="wrap">
            <Stack gap={4} maw={520}>
              <Title order={3} size="h4">
                {t('home_ctaTitle')}
              </Title>
              <Text size="sm" c="dimmed">
                {t('home_ctaBody')}
              </Text>
            </Stack>

            <Button
              component={Link}
              to={lp('/kontribusi')}
              variant="light"
              leftSection={<PlusCircle size={16} />}
            >
              {t('home_ctaButton')}
            </Button>
          </Group>
          <Text size="xs" c="dimmed">
            {t('home_ctaFaqPrefix')}{' '}
            <Anchor component={Link} to={lp('/faq')}>
              {t('home_ctaFaqLink')}
            </Anchor>
            {t('home_ctaFaqSuffix')}
          </Text>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between" align="center" gap="lg" wrap="wrap">
            <Stack gap={4} maw={520}>
              <Group gap={6}>
                <Languages size={18} />
                <Title order={3} size="h4">
                  {t('home_askTitle')}
                </Title>
              </Group>
              <Text size="sm" c="dimmed">
                {t('home_askBody')}
              </Text>
            </Stack>

            <Stack gap="xs" align="flex-end">
              <Anchor
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                underline="never"
                aria-label={t('common_getAppAria')}
              >
                <Image
                  src="/google_play.webp"
                  alt={t('common_getOnGooglePlay')}
                  h={40}
                  w="auto"
                  fit="contain"
                  decoding="async"
                />
              </Anchor>
              <Anchor
                component={Link}
                to={lp('/bantuan-terjemahan')}
                size="xs"
                c="dimmed"
              >
                {t('home_askFeedLink')}
              </Anchor>
            </Stack>
          </Group>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between" align="center" gap="lg" wrap="wrap">
            <Stack gap={8} maw={520}>
              <Stack gap={4}>
                <Group gap={8}>
                  <Image
                    src="/whatsapp.svg"
                    alt=""
                    h={18}
                    w={18}
                    fit="contain"
                    decoding="async"
                    aria-hidden
                  />
                  <Title order={3} size="h4">
                    {t('home_waTitle')}
                  </Title>
                </Group>
                <Text size="sm" c="dimmed">
                  {t('home_waBody')}
                </Text>
              </Stack>
              <Button
                component="a"
                href={WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="light"
                color="green"
                w="fit-content"
              >
                {t('home_waButton')}
              </Button>
            </Stack>

            <Anchor
              href={WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              underline="never"
              aria-label={t('home_waButton')}
            >
              <Paper withBorder p={6} bg="#fff" radius="sm">
                <Image
                  src="/whatsapp-group-qr.svg"
                  alt={t('home_waQrAlt')}
                  h={120}
                  w={120}
                  fit="contain"
                  decoding="async"
                />
              </Paper>
            </Anchor>
          </Group>
        </Card>
      </Stack>
    </Container>
  );
}
