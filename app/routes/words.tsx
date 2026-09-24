import { useLoaderData, useNavigation, useSearchParams, Link } from 'react-router';
import {
  ActionIcon,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { List, Search, ArrowRight, X, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/words';
import { listWordsAtoZ } from '../application/use-cases/word.use-case';
import { buildMetaTags } from '../application/utils/seo';
import { WordCard } from '../presentation/components/word/word-card';
import { WordListSkeleton } from '../presentation/components/word/word-card-skeleton';
import type { WordSummary } from '../domain/entities/word.entity';
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
  const query = data?.q
    ? t('word_listTitleQuery', { q: data.q })
    : t('word_listTitle');
  return buildMetaTags({
    title: query,
    description: t('seo_wordsDescription'),
    path: `${localePath(locale, '/words')}${data?.q ? `?q=${encodeURIComponent(data.q)}` : ''}`,
    locale,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const wordType = url.searchParams.get('word_type') || undefined;
  const cursor = url.searchParams.get('cursor') || undefined;

  try {
    const res = await listWordsAtoZ({
      q,
      wordType,
      cursor,
      limit: 25,
      signal: request.signal,
    });
    return {
      q,
      wordType,
      items: res.data,
      meta: res.meta ?? { limit: 25, next_cursor: null, has_more: false },
    };
  } catch {
    return {
      q,
      wordType,
      items: [],
      meta: { limit: 25, next_cursor: null, has_more: false },
    };
  }
}

export default function WordsPage() {
  const { q, wordType, items, meta } = useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const lp = useLocalePath();
  const isLoading =
    navigation.state === 'loading' &&
    stripLocalePrefix(navigation.location.pathname).path === '/words';

  const handleFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const filterQuery = (formData.get('filter_q') as string)?.trim() ?? '';
    const next = new URLSearchParams();
    if (filterQuery) next.set('q', filterQuery);
    if (wordType) next.set('word_type', wordType);
    setSearchParams(next);
  };

  const clearFilter = () => {
    const next = new URLSearchParams();
    if (wordType) next.set('word_type', wordType);
    setSearchParams(next);
  };

  // Group items by their first character
  const groupedItems = items.reduce<Record<string, WordSummary[]>>((acc, word) => {
    const firstChar = word.lemma.charAt(0).toUpperCase();
    const key = /[A-Z]/.test(firstChar) ? firstChar : '#';
    if (!acc[key]) acc[key] = [];
    acc[key].push(word);
    return acc;
  }, {});

  const groupKeys = Object.keys(groupedItems).sort();

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Stack gap="sm">
          <Group justify="space-between" gap="md" wrap="wrap" align="flex-start">
            <Stack gap={4}>
              <Group gap="xs">
                <ThemeIcon variant="light" size="md" radius="sm">
                  <List size={16} />
                </ThemeIcon>
                <Title order={2}>{t('word_listHeading')}</Title>
              </Group>
              <Text size="sm" c="dimmed">
                {t('word_listIntro')}
              </Text>
            </Stack>

            {/* Quick Filter Form */}
            <form onSubmit={handleFilterSubmit}>
              <Group gap="xs" wrap="nowrap">
                <TextInput
                  name="filter_q"
                  defaultValue={q}
                  placeholder={t('word_listFilterPlaceholder')}
                  size="xs"
                  w={230}
                  leftSection={<Search size={13} />}
                  rightSection={
                    q ? (
                      <ActionIcon
                        variant="subtle"
                        size="xs"
                        onClick={clearFilter}
                        aria-label={t('word_listClearFilterAria')}
                      >
                        <X size={12} />
                      </ActionIcon>
                    ) : null
                  }
                />
                <Button type="submit" size="xs" leftSection={<Search size={13} />}>
                  {t('word_listFilterSubmit')}
                </Button>
              </Group>
            </form>
          </Group>
          <Divider />
        </Stack>

        {/* Items Section */}
        {isLoading && items.length > 0 ? (
          <WordListSkeleton count={6} />
        ) : items.length > 0 ? (
          <Stack gap="xl">
            {groupKeys.map((letter) => (
              <Stack key={letter} gap="sm">
                <Group
                  gap="xs"
                  pt="xs"
                  pb={4}
                  style={{
                    position: 'sticky',
                    top: 60,
                    zIndex: 10,
                    background: 'var(--mantine-color-body)',
                  }}
                >
                  <ThemeIcon size="sm" variant="filled" radius="sm" fw={700}>
                    {letter}
                  </ThemeIcon>
                  <Text size="xs" c="dimmed" fw={500}>
                    {t('word_listWordCount', { count: groupedItems[letter].length })}
                  </Text>
                </Group>

                <Stack gap="xs">
                  {groupedItems[letter].map((word) => (
                    <WordCard key={word.id} word={word} />
                  ))}
                </Stack>
              </Stack>
            ))}

            {/* Cursor Pagination */}
            {meta.has_more && meta.next_cursor && (
              <Group justify="center" pt="md">
                <Button
                  component={Link}
                  to={lp(
                    '/words',
                    `?${new URLSearchParams({
                      ...(q ? { q } : {}),
                      ...(wordType ? { word_type: wordType } : {}),
                      cursor: meta.next_cursor,
                    }).toString()}`,
                  )}
                  variant="light"
                  leftSection={<ArrowRight size={16} />}
                >
                  {t('word_listLoadNext')}
                </Button>
              </Group>
            )}
          </Stack>
        ) : (
          <Stack align="center" gap="sm" py={48} maw={420} mx="auto">
            <ThemeIcon size={52} variant="light" color="gray" radius="xl">
              <AlertCircle size={24} />
            </ThemeIcon>
            <Title order={4} ta="center">
              {q ? t('word_listEmptyQuery', { q }) : t('word_listEmptyNone')}
            </Title>
            {q && (
              <>
                <Text size="sm" c="dimmed" ta="center">
                  {t('word_listEmptyHint')}
                </Text>
                <Button
                  variant="light"
                  size="xs"
                  onClick={clearFilter}
                  leftSection={<X size={14} />}
                  mt="xs"
                >
                  {t('word_listClearFilter')}
                </Button>
              </>
            )}
          </Stack>
        )}

        <Box />
      </Stack>
    </Container>
  );
}
