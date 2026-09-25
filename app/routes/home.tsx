import { Link, useLoaderData } from 'react-router';
import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  Divider,
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
                to={lp('/words', `?letter=${letter}`)}
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

        <Stack gap="sm">
          <Title order={2} size="h5" c="dimmed" tt="uppercase" fw={600}>
            {t('home_joinHeading')}
          </Title>

          <Card withBorder padding="md" radius="md">
            <Stack gap="md">
              <Group justify="space-between" align="center" gap="md" wrap="wrap">
                <Group gap="sm" wrap="nowrap" maw={480} style={{ flex: 1 }}>
                  <PlusCircle size={18} style={{ flexShrink: 0 }} />
                  <Stack gap={2}>
                    <Text size="sm" fw={600}>
                      {t('home_ctaTitle')}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t('home_ctaBody')}
                    </Text>
                  </Stack>
                </Group>
                <Button
                  component={Link}
                  to={lp('/kontribusi')}
                  variant="light"
                  size="compact-sm"
                  leftSection={<PlusCircle size={14} />}
                >
                  {t('home_ctaButton')}
                </Button>
              </Group>

              <Divider />

              <Group justify="space-between" align="center" gap="md" wrap="wrap">
                <Group gap="sm" wrap="nowrap" maw={480} style={{ flex: 1 }}>
                  <Languages size={18} style={{ flexShrink: 0 }} />
                  <Stack gap={2}>
                    <Text size="sm" fw={600}>
                      {t('home_askTitle')}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t('home_askBody')}{' '}
                      <Anchor
                        component={Link}
                        to={lp('/bantuan-terjemahan')}
                        size="xs"
                      >
                        {t('home_askFeedLink')}
                      </Anchor>
                    </Text>
                  </Stack>
                </Group>
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
                    h={36}
                    w="auto"
                    fit="contain"
                    decoding="async"
                  />
                </Anchor>
              </Group>

              <Divider />

              <Group justify="space-between" align="center" gap="md" wrap="wrap">
                <Group gap="sm" wrap="nowrap" maw={400} style={{ flex: 1 }}>
                  <Image
                    src="/whatsapp.svg"
                    alt=""
                    h={18}
                    w={18}
                    fit="contain"
                    decoding="async"
                    aria-hidden
                    style={{ flexShrink: 0 }}
                  />
                  <Stack gap={2}>
                    <Text size="sm" fw={600}>
                      {t('home_waTitle')}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t('home_waBody')}
                    </Text>
                    <Anchor
                      href={WHATSAPP_GROUP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="xs"
                      c="green"
                      fw={500}
                      w="fit-content"
                    >
                      {t('home_waButton')}
                    </Anchor>
                  </Stack>
                </Group>
                <Anchor
                  href={WHATSAPP_GROUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="never"
                  aria-label={t('home_waButton')}
                >
                  <Paper
                    withBorder
                    p={6}
                    radius="sm"
                    className="whatsapp-group-qr-frame"
                  >
                    <Image
                      src="/whatsapp-group-qr.svg"
                      alt={t('home_waQrAlt')}
                      h={112}
                      w={112}
                      fit="contain"
                      decoding="async"
                    />
                  </Paper>
                </Anchor>
              </Group>
            </Stack>
          </Card>

          <Text size="xs" c="dimmed">
            {t('home_ctaFaqPrefix')}{' '}
            <Anchor component={Link} to={lp('/faq')}>
              {t('home_ctaFaqLink')}
            </Anchor>
            {t('home_ctaFaqSuffix')}
          </Text>
        </Stack>
      </Stack>
    </Container>
  );
}
