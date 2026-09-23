import { Link, useLoaderData } from 'react-router';
import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Sparkles, PlusCircle } from 'lucide-react';
import type { Route } from './+types/home';
import { getWordOfDay } from '../application/use-cases/word.use-case';
import { buildHomeJsonLd, buildMetaTags } from '../application/utils/seo';
import { env } from '../infrastructure/config/env';
import { SearchBar } from '../presentation/components/word/search-bar';
import { WordOfTheDayCard } from '../presentation/components/word/word-of-the-day-card';

export function meta(_args: Route.MetaArgs) {
  return [
    ...buildMetaTags({
      title: 'Kamus Sambas',
      description:
        'Kamus Sambas untuk mencari kosakata, makna, terjemahan, dan peribahasa bahasa Melayu Sambas ke bahasa Indonesia. Terbuka dan kolaboratif.',
      path: '/',
    }),
    // Hanya produksi. Staging noindex, jadi entitas ini tidak boleh ikut terbit.
    ...(env.isProd ? [{ 'script:ld+json': buildHomeJsonLd() }] : []),
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const wordOfDay = await getWordOfDay(request.signal);
  return { wordOfDay };
}

const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function Home() {
  const { wordOfDay } = useLoaderData<typeof loader>();

  return (
    <Container size="md" py={44}>
      <Stack gap={44}>
        {/* Hero Section */}
        <Stack align="center" gap="md" maw={640} mx="auto" pt="sm">
          <Badge
            variant="light"
            color="amber"
            leftSection={<Sparkles size={13} />}
            size="sm"
          >
            Kamus Digital Terbuka Bahasa Sambas
          </Badge>

          <Title order={1} ta="center" fw={800}>
            Kamus Sambas
          </Title>

          <Text c="dimmed" size="lg" ta="center" maw={560}>
            Temukan arti kata, terjemahan Indonesia, contoh kalimat, dan lafal
            otentik bahasa Melayu Sambas.
          </Text>

          <SearchBar autoFocus />
        </Stack>

        {/* Word of the Day Section */}
        {wordOfDay.word && (
          <Stack gap="xs">
            <Title order={2} size="h5" c="dimmed" tt="uppercase" fw={600}>
              Sorotan Hari Ini
            </Title>
            <WordOfTheDayCard wordOfDay={wordOfDay} />
          </Stack>
        )}

        {/* A-Z Quick Browsing */}
        <Stack gap="sm">
          <Group justify="space-between">
            <Title order={2} size="h5" c="dimmed" tt="uppercase" fw={600}>
              Jelajah Alfabetis (A-Z)
            </Title>
            <Anchor component={Link} to="/words" size="xs" c="dimmed" py={4}>
              Lihat semua kata
            </Anchor>
          </Group>

          <Group gap="xs">
            {ALPHABETS.map((letter) => (
              <ActionIcon
                key={letter}
                component={Link}
                to={`/words?q=${letter}`}
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

        {/* Community Contribution CTA */}
        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between" align="center" gap="lg" wrap="wrap">
            <Stack gap={4} maw={520}>
              <Title order={3} size="h4">
                Tahu kata Sambas yang belum tercatat?
              </Title>
              <Text size="sm" c="dimmed">
                Kamus ini dibangun secara kolaboratif bersama para penutur bahasa
                Melayu Sambas. Siapapun dapat berkontribusi menambah kosakata baru.
              </Text>
            </Stack>

            <Button
              component={Link}
              to="/kontribusi"
              variant="light"
              leftSection={<PlusCircle size={16} />}
            >
              Ajukan Kata Baru
            </Button>
          </Group>
        </Card>
      </Stack>
    </Container>
  );
}
