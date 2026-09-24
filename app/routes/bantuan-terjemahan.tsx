import { Link, useLoaderData, useNavigation, useSearchParams } from 'react-router';
import {
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { ArrowRight, Languages, Smartphone } from 'lucide-react';
import type { Route } from './+types/bantuan-terjemahan';
import { listPublishedTranslationHelps } from '@/application/use-cases/translation-help.use-case';
import { buildMetaTags } from '@/application/utils/seo';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
  stripLocalePrefix,
} from '@/application/i18n/locales';
import { useLocalePath } from '@/application/i18n/use-locale';

import { formatDateId } from '@/application/utils/formatters';
import { displayImageUrl } from '@/presentation/utils/display-image-url';
import type { TranslationHelpPublicItem } from '@/domain/entities/translation-help.entity';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.iamutaki.sambasku';

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  return buildMetaTags({
    title: 'Tanya Terjemahan',
    description:
      'Baca pertanyaan terjemahan bahasa Sambas yang sudah tayang. Ajukan pertanyaan atau balas lewat aplikasi SambasKu.',
    path: localePath(locale, '/bantuan-terjemahan'),
    locale,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor') || undefined;

  try {
    const res = await listPublishedTranslationHelps({
      limit: 20,
      cursor,
      signal: request.signal,
    });
    return {
      items: res.data,
      meta: res.meta ?? { limit: 20, next_cursor: null, has_more: false },
    };
  } catch {
    return {
      items: [] as TranslationHelpPublicItem[],
      meta: { limit: 20, next_cursor: null, has_more: false },
    };
  }
}

function HelpCard({ item }: { item: TranslationHelpPublicItem }) {
  const lp = useLocalePath();
  const preview = item.body?.trim() || 'Pertanyaan dengan gambar';
  const thumb = displayImageUrl(item.images[0]?.public_url, { width: 320, height: 200 });

  return (
    <Card
      component={Link}
      to={lp(`/bantuan-terjemahan/${encodeURIComponent(item.id)}`)}
      withBorder
      padding="md"
      radius="md"
      shadow="none"
    >
      <Stack gap="sm">
        {thumb ? (
          <Image src={thumb} alt="" radius="sm" h={140} fit="cover" />
        ) : null}
        <Text size="sm" lineClamp={3}>
          {preview}
        </Text>
        <Group justify="space-between" gap="xs" wrap="nowrap">
          <Text size="xs" c="dimmed" lineClamp={1}>
            {item.username ? `@${item.username}` : 'Pengguna'} · {formatDateId(item.created_at)}
          </Text>
          <ArrowRight size={14} opacity={0.5} />
        </Group>
      </Stack>
    </Card>
  );
}

export default function BantuanTerjemahanFeedPage() {
  const { items, meta } = useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading =
    navigation.state === 'loading' &&
    stripLocalePrefix(navigation.location.pathname).path === '/bantuan-terjemahan';

  return (
    <Container size="md" py={44}>
      <Stack gap="xl">
        <Stack gap="sm">
          <Group gap="xs">
            <Languages size={22} />
            <Title order={1} fw={800}>
              Tanya Terjemahan
            </Title>
          </Group>
          <Text c="dimmed" maw={560}>
            Feed pertanyaan terjemahan yang sudah ditayangkan. Membaca
            bebas di web; mengajukan atau membalas hanya lewat aplikasi SambasKu.
          </Text>
        </Stack>

        <Card withBorder padding="lg" radius="md" bg="var(--mantine-color-body)">
          <Group justify="space-between" align="center" gap="lg" wrap="wrap">
            <Stack gap={4} maw={480}>
              <Group gap={6}>
                <Smartphone size={16} />
                <Text fw={600}>Ingin tanya terjemahan?</Text>
              </Group>
              <Text size="sm" c="dimmed">
                Ajukan pertanyaan (teks atau foto) dan balas diskusi di aplikasi
                mobile SambasKu.
              </Text>
            </Stack>
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
          </Group>
        </Card>

        {isLoading ? (
          <Text c="dimmed" size="sm">
            Memuat…
          </Text>
        ) : items.length === 0 ? (
          <Stack gap="xs" py="xl" align="center">
            <Badge variant="light" color="gray">
              Belum ada yang tayang
            </Badge>
            <Text c="dimmed" ta="center" maw={420}>
              Belum ada tanya terjemahan yang dipublikasikan. Ajukan lewat
              aplikasi SambasKu.
            </Text>
            <Button
              component="a"
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="light"
              leftSection={<Smartphone size={16} />}
            >
              Buka di Google Play
            </Button>
          </Stack>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {items.map((item) => (
              <HelpCard key={item.id} item={item} />
            ))}
          </SimpleGrid>
        )}

        {meta.has_more && meta.next_cursor ? (
          <Group justify="center">
            <Button
              variant="default"
              onClick={() =>
                setSearchParams({ cursor: meta.next_cursor as string })
              }
            >
              Muat lebih banyak
            </Button>
          </Group>
        ) : null}
      </Stack>
    </Container>
  );
}
