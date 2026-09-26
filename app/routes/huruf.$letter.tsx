import { Link, redirect, useLoaderData, useNavigation } from 'react-router';
import {
  ActionIcon,
  Anchor,
  Button,
  Container,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { List, ArrowRight, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/huruf.$letter';
import { listWordsAtoZ } from '../application/use-cases/word.use-case';
import { buildLetterJsonLd, buildMetaTags } from '../application/utils/seo';
import { WordCard } from '../presentation/components/word/word-card';
import { env } from '@/infrastructure/config/env';
import type { WordSummary } from '@/domain/entities/word.entity';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { useLocalePath } from '@/application/i18n/use-locale';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

export function meta({ data, params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  const letter = (data?.letter ?? params.letter ?? '').toLowerCase();
  return [
    ...buildMetaTags({
      title: t('letter_seoTitle', { letter: letter.toUpperCase() }),
      description: t('letter_seoDescription', { letter: letter.toUpperCase() }),
      path: localePath(locale, `/huruf/${letter}`),
      locale,
    }),
    // JSON-LD hanya produksi (staging noindex); RR7 me-escape HTML
    // untuk key script:ld+json.
    ...(env.isProd && data?.letter
      ? [
          {
            'script:ld+json': buildLetterJsonLd(
              data.letter,
              (data.items ?? []).filter((word) => word.is_verified),
              locale,
            ),
          },
        ]
      : []),
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const raw = params.letter ?? '';
  if (!/^[A-Za-z]$/.test(raw)) {
    throw new Response('Not Found', { status: 404 });
  }
  const letter = raw.toLowerCase();
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  // Bentuk kanonik lowercase; uppercase 301 supaya satu URL per huruf.
  if (raw !== letter) {
    throw redirect(localePath(locale, `/huruf/${letter}`), 301);
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor') || undefined;

  try {
    const res = await listWordsAtoZ({
      letter,
      cursor,
      limit: 25,
      signal: request.signal,
    });
    return {
      letter,
      items: res.data,
      meta: res.meta ?? { limit: 25, next_cursor: null, has_more: false },
    };
  } catch {
    // Halaman browse tidak fail-closed: tampil kosong, bukan error 500.
    return {
      letter,
      items: [] as WordSummary[],
      meta: { limit: 25, next_cursor: null, has_more: false },
    };
  }
}

export default function HurufPage() {
  const { letter, items, meta } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const lp = useLocalePath();
  const isLoading = navigation.state === 'loading';
  const displayLetter = letter.toUpperCase();

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {/* Breadcrumb SSR - selaras BreadcrumbList JSON-LD */}
        <Group gap={6} wrap="wrap">
          <Anchor component={Link} to={lp('/')} size="xs" c="dimmed">
            {t('word_homeCrumb')}
          </Anchor>
          <Text size="xs" c="dimmed">
            /
          </Text>
          <Anchor component={Link} to={lp('/words')} size="xs" c="dimmed">
            {t('word_wordsCrumb')}
          </Anchor>
          <Text size="xs" c="dimmed">
            /
          </Text>
          <Text size="xs" fw={500}>
            {t('letter_heading', { letter: displayLetter })}
          </Text>
        </Group>

        <Stack gap="sm">
          <Group gap="xs">
            <ThemeIcon variant="light" size="md" radius="sm">
              <List size={16} />
            </ThemeIcon>
            {/* Satu-satunya h1 halaman ini (QA UX-08) */}
            <Title order={1} size="h2">
              {t('letter_heading', { letter: displayLetter })}
            </Title>
          </Group>
          <Text size="sm" c="dimmed">
            {t('letter_intro', { letter: displayLetter })}
          </Text>
        </Stack>

        {/* Strip A-Z: internal linking antar halaman huruf */}
        <Group gap="xs">
          {ALPHABET.map((l) => (
            <ActionIcon
              key={l}
              component={Link}
              to={lp(`/huruf/${l}`)}
              variant={l === letter ? 'filled' : 'default'}
              size="input-lg"
              radius="sm"
              fw={500}
              tt="uppercase"
              aria-current={l === letter ? 'page' : undefined}
            >
              {l}
            </ActionIcon>
          ))}
        </Group>

        {!isLoading && items.length > 0 ? (
          <Stack gap="lg">
            <Stack gap="xs">
              {items.map((word) => (
                <WordCard key={word.id} word={word} />
              ))}
            </Stack>

            {meta.has_more && meta.next_cursor && (
              <Group justify="center" pt="md">
                <Button
                  component={Link}
                  to={lp(`/huruf/${letter}`, `?cursor=${meta.next_cursor}`)}
                  variant="light"
                  leftSection={<ArrowRight size={16} />}
                >
                  {t('word_listLoadNext')}
                </Button>
              </Group>
            )}
          </Stack>
        ) : items.length === 0 && !isLoading ? (
          <Stack align="center" gap="sm" py={48} maw={420} mx="auto">
            <ThemeIcon size={52} variant="light" color="gray" radius="xl">
              <AlertCircle size={24} />
            </ThemeIcon>
            <Title order={4} ta="center">
              {t('letter_empty', { letter: displayLetter })}
            </Title>
          </Stack>
        ) : null}
      </Stack>
    </Container>
  );
}
