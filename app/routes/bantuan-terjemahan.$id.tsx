import { Link, useLoaderData } from 'react-router';
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
import { ArrowLeft, Languages, Pin, Smartphone } from 'lucide-react';
import type { Route } from './+types/bantuan-terjemahan.$id';
import { getTranslationHelpDetail } from '@/application/use-cases/translation-help.use-case';
import { buildMetaTags } from '@/application/utils/seo';
import { formatDateId } from '@/application/utils/formatters';
import { displayImageUrl } from '@/presentation/utils/display-image-url';
import type { TranslationHelpReply } from '@/domain/entities/translation-help.entity';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.iamutaki.sambasku';

export function meta({ data }: Route.MetaArgs) {
  if (!data?.help) {
    return buildMetaTags({
      title: 'Bantuan Tidak Ditemukan',
      description: 'Permintaan bantuan terjemahan tidak ditemukan atau belum tayang.',
      path: '/bantuan-terjemahan',
    });
  }

  const excerpt =
    data.help.body?.trim().slice(0, 140) ||
    'Permintaan bantuan terjemahan bahasa Sambas.';
  const rawImage = data.help.images[0]?.public_url;
  const ogImage = displayImageUrl(rawImage, { width: 1200 }) ?? rawImage;

  return buildMetaTags({
    title: 'Bantuan Terjemahan',
    description: excerpt,
    path: `/bantuan-terjemahan/${encodeURIComponent(data.help.id)}`,
    image: ogImage,
    type: 'article',
  });
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const id = params.id?.trim();
  if (!id) {
    throw new Response('ID tidak valid', { status: 400 });
  }

  try {
    const help = await getTranslationHelpDetail(id, request.signal);
    return { help };
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode ?? 404;
    throw new Response('Bantuan terjemahan tidak ditemukan', { status });
  }
}

function replyBodyLabel(reply: TranslationHelpReply): string {
  if (reply.status === 'taken_down') {
    return 'Balasan ini telah diturunkan oleh moderasi.';
  }
  if (reply.status === 'deleted_by_author') {
    return 'Balasan dihapus oleh penulis.';
  }
  return reply.body?.trim() || '';
}

function sortReplies(replies: TranslationHelpReply[]): TranslationHelpReply[] {
  return [...replies].sort((a, b) => {
    if (a.is_pinned === b.is_pinned) return 0;
    return a.is_pinned ? -1 : 1;
  });
}

export default function BantuanTerjemahanDetailPage() {
  const { help } = useLoaderData<typeof loader>();
  const replies = sortReplies(help.replies);
  const author = help.username ? `@${help.username}` : 'Pengguna';

  return (
    <Container size="sm" py={44}>
      <Stack gap="xl">
        <Group gap={6} wrap="wrap">
          <Anchor component={Link} to="/" size="xs" c="dimmed">
            Beranda
          </Anchor>
          <Text size="xs" c="dimmed">
            /
          </Text>
          <Anchor component={Link} to="/bantuan-terjemahan" size="xs" c="dimmed">
            Bantuan Terjemahan
          </Anchor>
        </Group>

        <Button
          component={Link}
          to="/bantuan-terjemahan"
          variant="subtle"
          size="compact-sm"
          leftSection={<ArrowLeft size={15} />}
          w="fit-content"
        >
          Kembali ke feed
        </Button>

        <Stack gap="md">
          <Group gap="xs">
            <Languages size={20} />
            <Title order={1} fw={800} size="h2">
              Bantuan Terjemahan
            </Title>
          </Group>

          <Text size="sm" c="dimmed">
            {author} · {formatDateId(help.created_at)}
          </Text>

          {help.body?.trim() ? (
            <Text size="lg" style={{ whiteSpace: 'pre-wrap' }}>
              {help.body}
            </Text>
          ) : null}

          {help.images.length > 0 ? (
            <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
              {help.images.map((img) => {
                const src = displayImageUrl(img.public_url, { width: 800 });
                return (
                  <Image
                    key={img.public_url}
                    src={src}
                    alt="Lampiran bantuan terjemahan"
                    radius="md"
                    fit="cover"
                    mah={320}
                  />
                );
              })}
            </SimpleGrid>
          ) : null}
        </Stack>

        <Stack gap="sm">
          <Title order={2} size="h4">
            Balasan ({replies.length})
          </Title>

          {replies.length === 0 ? (
            <Text size="sm" c="dimmed">
              Belum ada balasan.
            </Text>
          ) : (
            <Stack gap="sm">
              {replies.map((reply) => (
                <Card key={reply.id} withBorder padding="md" radius="md" shadow="none">
                  <Stack gap="xs">
                    <Group gap="xs" wrap="wrap">
                      <Text size="sm" fw={600}>
                        {reply.username ? `@${reply.username}` : 'Pengguna'}
                      </Text>
                      {reply.is_verifier ? (
                        <Badge size="sm" color="teal" variant="light">
                          Verifikator
                        </Badge>
                      ) : null}
                      {reply.is_pinned ? (
                        <Badge
                          size="sm"
                          color="amber"
                          variant="light"
                          leftSection={<Pin size={11} />}
                        >
                          Disematkan
                        </Badge>
                      ) : null}
                      <Text size="xs" c="dimmed">
                        {formatDateId(reply.created_at)}
                      </Text>
                    </Group>
                    <Text
                      size="sm"
                      c={reply.status === 'published' ? undefined : 'dimmed'}
                      fs={reply.status === 'published' ? undefined : 'italic'}
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {replyBodyLabel(reply)}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>

        <Card withBorder padding="lg" radius="md">
          <Stack gap="sm">
            <Text fw={600}>Balas di aplikasi</Text>
            <Text size="sm" c="dimmed">
              Menulis balasan hanya tersedia di aplikasi SambasKu. Unduh di Google
              Play untuk ikut membantu.
            </Text>
            <Group gap="md" wrap="wrap">
              <Button
                component="a"
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="light"
                leftSection={<Smartphone size={16} />}
              >
                Balas di aplikasi
              </Button>
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
                  h={36}
                  w="auto"
                  fit="contain"
                  decoding="async"
                />
              </Anchor>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
