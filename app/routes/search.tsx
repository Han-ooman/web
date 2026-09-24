import { Link, useLoaderData, useNavigation, useSearchParams } from 'react-router';
import {
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Group,
  SegmentedControl,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { Search, AlertCircle, PlusCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/search';
import { searchWords } from '../application/use-cases/word.use-case';
import { buildMetaTags } from '../application/utils/seo';
import { SearchBar } from '../presentation/components/word/search-bar';
import { WordCard } from '../presentation/components/word/word-card';
import { WordListSkeleton } from '../presentation/components/word/word-card-skeleton';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
  stripLocalePrefix,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { useLocalePath } from '@/application/i18n/use-locale';

export function meta({ data, params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  const query = data?.q ? `"${data.q}"` : t('seo_searchQueryFallback');
  return buildMetaTags({
    title: t('seo_searchTitle', { query }),
    description: t('seo_searchDescription', { query }),
    path: `${localePath(locale, '/search')}${data?.q ? `?q=${encodeURIComponent(data.q)}` : ''}`,
    locale,
    noindexAlways: true,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const searchIn = (url.searchParams.get('search_in') as 'lemma' | 'translation') || 'lemma';
  const wordType = url.searchParams.get('word_type') || undefined;
  const cursor = url.searchParams.get('cursor') || undefined;

  if (!q) {
    return {
      q,
      searchIn,
      wordType,
      items: [],
      meta: { limit: 20, next_cursor: null, has_more: false },
    };
  }

  try {
    const res = await searchWords({
      q,
      searchIn,
      wordType,
      cursor,
      signal: request.signal,
    });
    return {
      q,
      searchIn,
      wordType,
      items: res.data,
      meta: res.meta ?? { limit: 20, next_cursor: null, has_more: false },
    };
  } catch {
    return {
      q,
      searchIn,
      wordType,
      items: [],
      meta: { limit: 20, next_cursor: null, has_more: false },
    };
  }
}

export default function SearchPage() {
  const { q, searchIn, wordType, items, meta } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const { t } = useTranslation();
    const lp = useLocalePath();
  const isLoading =
    navigation.state === 'loading' &&
    stripLocalePrefix(navigation.location.pathname).path === '/search';

  const typeOptions = [
    { label: t('search_typeAll'), value: '' },
    { label: t('search_typeWord'), value: 'word' },
    { label: t('search_typeIdiom'), value: 'idiom' },
    { label: t('search_typeProverb'), value: 'peribahasa' },
    { label: t('search_typeExpression'), value: 'ungkapan' },
  ];

  const handleFilterWordType = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set('word_type', value);
    } else {
      next.delete('word_type');
    }
    next.delete('cursor');
    setSearchParams(next);
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Stack align="center" gap="md">
          <Title order={2} ta="center">
            {t('search_pageTitle')}
          </Title>
          <SearchBar initialQuery={q} initialDirection={searchIn} />
        </Stack>

        {q && (
          <>
            <Divider />
            <Group justify="space-between" gap="md" wrap="wrap">
              <Group gap="sm">
                <Text size="xs" c="dimmed" fw={500}>
                  {t('search_filterType')}
                </Text>
                <SegmentedControl
                  size="xs"
                  value={wordType ?? ''}
                  onChange={handleFilterWordType}
                  data={typeOptions}
                />
              </Group>

              <Group gap={4}>
                <Text size="xs" c="dimmed">
                  {t('search_directionLabel')}
                </Text>
                <Badge size="sm" variant="outline">
                  {searchIn === 'lemma' ? t('search_directionLemma') : t('search_directionTranslation')}
                </Badge>
              </Group>
            </Group>
          </>
        )}

        {isLoading && q ? (
          <WordListSkeleton count={5} />
        ) : !q ? (
          <Stack align="center" gap="sm" py={64}>
            <ThemeIcon size={52} variant="light" radius="xl">
              <Search size={24} />
            </ThemeIcon>
            <Title order={4} fw={500}>
              {t('search_emptyTitle')}
            </Title>
            <Text size="sm" c="dimmed" maw={400} ta="center">
              {t('search_emptyBody')}
            </Text>
          </Stack>
        ) : items.length > 0 ? (
          <Stack gap="md">
            <Text size="xs" c="dimmed">
              {t('search_foundPrefix')}{' '}
              <Text span fw={600} c="var(--mantine-color-text)">
                &quot;{q}&quot;
              </Text>
            </Text>

            <Stack gap="sm">
              {items.map((word) => (
                <WordCard key={word.id} word={word} />
              ))}
            </Stack>

            {meta.has_more && meta.next_cursor && (
              <Group justify="center" pt="sm">
                <Button
                  component={Link}
                  to={lp(
                    '/search',
                    `?q=${encodeURIComponent(q)}&search_in=${searchIn}&cursor=${encodeURIComponent(meta.next_cursor)}${
                      wordType ? `&word_type=${wordType}` : ''
                    }`,
                  )}
                  variant="light"
                  leftSection={<ArrowRight size={16} />}
                >
                  {t('common_nextPage')}
                </Button>
              </Group>
            )}
          </Stack>
        ) : (
          <Card withBorder padding="lg" radius="md" maw={520} mx="auto">
            <Stack align="center" gap="sm" py="xs">
              <ThemeIcon size={52} variant="light" color="red" radius="xl">
                <AlertCircle size={24} />
              </ThemeIcon>

              <Title order={4}>{t('search_missTitle', { q })}</Title>
              <Text size="sm" c="dimmed" ta="center">
                {t('search_missBody')}
              </Text>

              <Button
                component={Link}
                to={lp('/kontribusi', `?q=${encodeURIComponent(q)}`)}
                variant="light"
                leftSection={<PlusCircle size={16} />}
                mt="xs"
              >
                {t('search_missCta')}
              </Button>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
