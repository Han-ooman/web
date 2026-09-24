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
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Sparkles, PlusCircle, Languages } from 'lucide-react';
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
        'Kamus Sambas digital terbuka: cari kosakata Melayu Sambas, makna, terjemahan Indonesia, contoh kalimat, dan lafal. Jelajahi daftar A-Z atau kontribusi kata baru.',
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
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.iamutaki.sambasku';

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
          <Text size="xs" c="dimmed">
            Ingin tahu mengapa kamus ini ada? Baca{' '}
            <Anchor component={Link} to="/faq">
              FAQ
            </Anchor>
            .
          </Text>
        </Card>

        {/* CTA Bantuan Terjemahan → aplikasi mobile */}
        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between" align="center" gap="lg" wrap="wrap">
            <Stack gap={4} maw={520}>
              <Group gap={6}>
                <Languages size={18} />
                <Title order={3} size="h4">
                  Butuh bantuan terjemahan Sambas?
                </Title>
              </Group>
              <Text size="sm" c="dimmed">
                Ajukan pertanyaan (teks atau foto) dan ikut membantu menjawab di
                aplikasi SambasKu. Feed yang sudah tayang juga bisa dibaca di web.
              </Text>
            </Stack>

            <Stack gap="xs" align="flex-end">
              <Anchor
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                underline="never"
                aria-label="Dapatkan aplikasi SambasKu di Google Play"
              >
                <Image
                  src="/google_play.webp"
                  alt="Dapatkan di Google Play"
                  h={40}
                  w="auto"
                  fit="contain"
                  decoding="async"
                />
              </Anchor>
              <Anchor component={Link} to="/bantuan-terjemahan" size="xs" c="dimmed">
                Lihat feed bantuan terjemahan
              </Anchor>
            </Stack>
          </Group>
        </Card>
      </Stack>
    </Container>
  );
}
