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
import type { Route } from './+types/search';
import { searchWords } from '../application/use-cases/word.use-case';
import { buildMetaTags } from '../application/utils/seo';
import { SearchBar } from '../presentation/components/word/search-bar';
import { WordCard } from '../presentation/components/word/word-card';
import { WordListSkeleton } from '../presentation/components/word/word-card-skeleton';

export function meta({ data }: Route.MetaArgs) {
  const query = data?.q ? `"${data.q}"` : 'Kosakata';
  return buildMetaTags({
    title: `Pencarian ${query}`,
    description: `Hasil pencarian kosakata ${query} dalam Kamus Digital Sambas-Indonesia.`,
    path: `/search${data?.q ? `?q=${encodeURIComponent(data.q)}` : ''}`,
    // Halaman hasil pencarian = thin content, noindex di semua environment.
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

const WORD_TYPE_OPTIONS = [
  { label: 'Semua', value: '' },
  { label: 'Kata', value: 'word' },
  { label: 'Idiom', value: 'idiom' },
  { label: 'Peribahasa', value: 'peribahasa' },
  { label: 'Ungkapan', value: 'ungkapan' },
];

export default function SearchPage() {
  const { q, searchIn, wordType, items, meta } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading' && navigation.location.pathname === '/search';

  const handleFilterWordType = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set('word_type', value);
    } else {
      next.delete('word_type');
    }
    next.delete('cursor'); // Reset cursor on filter change
    setSearchParams(next);
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {/* Search Header */}
        <Stack align="center" gap="md">
          <Title order={2} ta="center">
            Pencarian Kosakata
          </Title>
          <SearchBar initialQuery={q} initialDirection={searchIn} />
        </Stack>

        {/* Filter Options */}
        {q && (
          <>
            <Divider />
            <Group justify="space-between" gap="md" wrap="wrap">
              <Group gap="sm">
                <Text size="xs" c="dimmed" fw={500}>
                  Filter tipe:
                </Text>
                <SegmentedControl
                  size="xs"
                  value={wordType ?? ''}
                  onChange={handleFilterWordType}
                  data={WORD_TYPE_OPTIONS}
                />
              </Group>

              <Group gap={4}>
                <Text size="xs" c="dimmed">
                  Arah:
                </Text>
                <Badge size="sm" variant="outline">
                  {searchIn === 'lemma' ? 'Sambas → Indonesia' : 'Indonesia → Sambas'}
                </Badge>
              </Group>
            </Group>
          </>
        )}

        {/* Results Area */}
        {isLoading && q ? (
          <WordListSkeleton count={5} />
        ) : !q ? (
          <Stack align="center" gap="sm" py={64}>
            <ThemeIcon size={52} variant="light" radius="xl">
              <Search size={24} />
            </ThemeIcon>
            <Title order={4} fw={500}>
              Ketik kata kunci untuk memulai
            </Title>
            <Text size="sm" c="dimmed" maw={400} ta="center">
              Kamu bisa mencari kata dalam bahasa Sambas atau mencari terjemahan dari
              bahasa Indonesia.
            </Text>
          </Stack>
        ) : items.length > 0 ? (
          <Stack gap="md">
            <Text size="xs" c="dimmed">
              Menemukan hasil untuk{' '}
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
                  to={`/search?q=${encodeURIComponent(q)}&search_in=${searchIn}&cursor=${encodeURIComponent(meta.next_cursor)}${
                    wordType ? `&word_type=${wordType}` : ''
                  }`}
                  variant="light"
                  leftSection={<ArrowRight size={16} />}
                >
                  Halaman Berikutnya
                </Button>
              </Group>
            )}
          </Stack>
        ) : (
          /* Empty State & Search Miss */
          <Card withBorder padding="lg" radius="md" maw={520} mx="auto">
            <Stack align="center" gap="sm" py="xs">
              <ThemeIcon size={52} variant="light" color="red" radius="xl">
                <AlertCircle size={24} />
              </ThemeIcon>

              <Title order={4}>Kata &quot;{q}&quot; belum ditemukan</Title>
              <Text size="sm" c="dimmed" ta="center">
                Kosakata ini belum terdaftar di kamus. Permintaan pencarianmu telah
                dicatat untuk ditinjau oleh tim verifikator kami.
              </Text>

              <Button
                component={Link}
                to={`/kontribusi?q=${encodeURIComponent(q)}`}
                variant="light"
                leftSection={<PlusCircle size={16} />}
                mt="xs"
              >
                Ajukan Kata Ini ke Kamus
              </Button>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
