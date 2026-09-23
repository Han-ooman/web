import { useState } from 'react';
import { useLoaderData, useNavigation, Link } from 'react-router';
import {
  Anchor,
  Badge,
  Blockquote,
  Box,
  Button,
  Card,
  Code,
  Container,
  Divider,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  ArrowLeft,
  CheckCircle2,
  Share2,
  Check,
  BookOpen,
  Layers,
  Sparkles,
  Volume2,
} from 'lucide-react';
import type { Route } from './+types/words.$lemma';
import { redirect } from 'react-router';
import { getWordByLemma, getWordDetail } from '@/application/use-cases/word.use-case';
import { buildMetaTags, buildWordJsonLd, buildWordSeoCopy } from '@/application/utils/seo';
import { env } from '@/infrastructure/config/env';
import { displayImageUrl } from '@/presentation/utils/display-image-url';
import { WordTypeBadge } from '@/presentation/components/word/word-type-badge';
import { WordAudioPlayer } from '@/presentation/components/word/pronunciation-player';
import { formatWordClass } from '@/application/utils/formatters';

export function meta({ data }: Route.MetaArgs) {
  if (!data?.word) {
    return buildMetaTags({
      title: 'Kata Tidak Ditemukan',
      description: 'Kata yang kamu cari tidak ditemukan di kamus.',
      path: '/words',
    });
  }

  const { word } = data;
  const { title, description } = buildWordSeoCopy(word);
  const rawImage = word.images.find((img) => img.is_primary)?.url ?? word.images[0]?.url;
  const primaryImage = displayImageUrl(rawImage, { width: 1200 }) ?? rawImage;

  return buildMetaTags({
    title,
    description,
    path: `/words/${encodeURIComponent(word.lemma)}`,
    image: primaryImage,
    type: 'article',
  });
}

// ULID Crockford base32 - 26 karakter. URL lama /words/<ulid> masih
// beredar (backlink/search engine) → 301 permanen ke /words/<lemma>.
const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

export async function loader({ params, request }: Route.LoaderArgs) {
  const { lemma } = params;
  if (!lemma) {
    throw new Response('Lemma kata tidak valid', { status: 400 });
  }

  try {
    if (ULID_RE.test(lemma)) {
      const word = await getWordDetail(lemma, request.signal);
      throw redirect(`/words/${encodeURIComponent(word.lemma)}`, 301);
    }
    const word = await getWordByLemma(lemma, request.signal);
    return { word };
  } catch (error) {
    if (error instanceof Response) throw error; // redirect 301 lolos
    const status = (error as { statusCode?: number }).statusCode ?? 404;
    throw new Response('Kata tidak ditemukan', { status });
  }
}

export default function WordDetailPage() {
  const { word } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [copied, setCopied] = useState(false);

  // Saat pindah ke kata terkait (route sama, :id beda) loader berjalan -
  // tampilkan skeleton agar data kata lama tidak tampil sesaat.
  const isLoadingRelated =
    navigation.state === 'loading' &&
    navigation.location.pathname !== '/words' &&
    navigation.location.pathname.startsWith('/words/');

  if (isLoadingRelated) {
    return (
      <Container size="sm" py="xl">
        <Stack gap="lg">
          <Skeleton height={44} width="45%" radius="md" />
          <Skeleton height={18} width="70%" radius="sm" />
          <Skeleton height={140} radius="md" />
          <Skeleton height={140} radius="md" />
        </Stack>
      </Container>
    );
  }

  const jsonLd = buildWordJsonLd(word);

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Container size="sm" py="xl">
      {/* Inject Schema.org JSON-LD untuk search engine - HANYA produksi
          (staging noindex). ponytail: escape "<" mencegah tag </script>
          nyelinap dari data API. */}
      {env.isProd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
      )}

      <Stack gap="lg">
        {/* Breadcrumb SSR - selaras BreadcrumbList JSON-LD */}
        <Group gap={6} wrap="wrap">
          <Anchor component={Link} to="/" size="xs" c="dimmed">
            Beranda
          </Anchor>
          <Text size="xs" c="dimmed">
            /
          </Text>
          <Anchor component={Link} to="/words" size="xs" c="dimmed">
            Daftar Kata A-Z
          </Anchor>
          <Text size="xs" c="dimmed">
            /
          </Text>
          <Text size="xs" fw={500}>
            {word.lemma}
          </Text>
        </Group>

        {/* Navigation & Action Bar */}
        <Group justify="space-between" gap="md">
          <Button
            component={Link}
            to="/words"
            variant="subtle"
            size="compact-sm"
            leftSection={<ArrowLeft size={15} />}
          >
            Kembali ke Daftar
          </Button>

          <Button
            variant="light"
            size="compact-sm"
            onClick={handleShare}
            leftSection={copied ? <Check size={15} /> : <Share2 size={15} />}
            color={copied ? 'teal' : undefined}
          >
            {copied ? 'Tautan Disalin' : 'Bagikan'}
          </Button>
        </Group>

        {/* Main Word Header */}
        <Stack gap="sm">
          <Stack gap="xs">
            <Group gap="sm" align="center" wrap="wrap">
              <Title order={1} fw={800}>
                {word.lemma}
              </Title>
              <Badge
                size="sm"
                variant="light"
                color={word.is_verified ? 'teal' : 'yellow'}
                leftSection={word.is_verified ? <CheckCircle2 size={13} /> : undefined}
              >
                {word.is_verified ? 'Terverifikasi' : 'Menunggu pengecekan'}
              </Badge>
              <WordTypeBadge type={word.word_type} />
            </Group>
            {/* Teks SSR untuk query "{lemma} bahasa sambas" - jangan client-only. */}
            <Text size="sm" c="dimmed">
              Arti kata {word.lemma} dalam bahasa Sambas (Melayu Sambas).
            </Text>
            {!word.is_verified ? (
              <Text size="sm" c="dimmed">
                Kata ini belum diperiksa tim Sambasku. Artinya atau terjemahannya bisa saja kurang tepat.
              </Text>
            ) : null}

            {/* Notasi IPA (teks) + audio multi-take dari word_audios */}
            {word.pronunciations.length > 0 && (
              <Group gap="sm" wrap="wrap">
                <Group gap={4} wrap="nowrap">
                  <Volume2 size={14} opacity={0.6} />
                  <Text size="xs" c="dimmed">
                    Lafal:
                  </Text>
                </Group>
                {word.pronunciations.map((p) => (
                  <Code key={p.id}>
                    {p.notation} {p.value}
                  </Code>
                ))}
              </Group>
            )}
            {(word.audios ?? []).length > 0 && (
              <Stack gap={6}>
                {(word.audios ?? []).map((a) => (
                  <WordAudioPlayer key={a.id} audio={a} />
                ))}
              </Stack>
            )}
          </Stack>

          {word.notes && (
            <Paper withBorder p="sm" radius="md">
              <Text size="xs" c="dimmed" fs="italic">
                Catatan etimologi/konteks: {word.notes}
              </Text>
            </Paper>
          )}
          <Divider />
        </Stack>

        {/* Meanings & Translations */}
        <Stack gap="md">
          <Group gap="xs">
            <BookOpen size={16} />
            <Title order={2} size="h5" c="dimmed" tt="uppercase" fw={700}>
              Makna &amp; Definisi ({word.meanings.length})
            </Title>
          </Group>

          <Stack gap="md">
            {word.meanings.map((meaning, index) => (
              <Card key={meaning.id} withBorder padding="md" radius="md" shadow="none">
                <Stack gap="sm">
                  <Group gap="xs">
                    <ThemeIcon size="xs" variant="light" radius="xl" fw={600}>
                      {index + 1}
                    </ThemeIcon>
                    {meaning.word_class && (
                      <Badge size="sm" variant="outline">
                        {formatWordClass(
                          meaning.word_class.code,
                          meaning.word_class.name,
                        )}
                      </Badge>
                    )}
                  </Group>

                  {/* Definition */}
                  <Text size="lg" lh="md" pl={30}>
                    {meaning.definition}
                  </Text>

                  {/* Indonesian Translations */}
                  {meaning.translations.length > 0 && (
                    <Stack gap={4} pl={30}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Terjemahan Indonesia:
                      </Text>
                      <Group gap="xs">
                        {meaning.translations.map((t, idx) => (
                          <Badge key={idx} size="sm" variant="light">
                            {t.translation_text}
                          </Badge>
                        ))}
                      </Group>
                    </Stack>
                  )}

                  {/* Example Sentences */}
                  {meaning.examples.length > 0 && (
                    <Stack gap="sm" pl={30} pt="xs">
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Contoh Penggunaan:
                      </Text>
                      {meaning.examples.map((ex) => (
                        <Stack key={ex.id} gap={2}>
                          <Blockquote p="sm" fs="italic" bd="xs">
                            {ex.source_sentence}
                          </Blockquote>
                          {ex.target_sentence && (
                            <Text size="xs" c="dimmed" pl="md">
                              Artinya: &quot;{ex.target_sentence}&quot;
                            </Text>
                          )}
                          {(ex.audios ?? []).length > 0 && (
                            <Stack gap={4} pl="md">
                              {(ex.audios ?? []).map((a) => (
                                <WordAudioPlayer key={a.id} audio={a} />
                              ))}
                            </Stack>
                          )}
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Card>
            ))}
          </Stack>
        </Stack>

        {/* Related Words: Synonyms, Antonyms, Related */}
        {word.related_words.length > 0 && (
          <Stack gap="sm">
            <Divider />
            <Group gap="xs">
              <Sparkles size={16} />
              <Title order={2} size="h5" c="dimmed" tt="uppercase" fw={700}>
                Kata Terkait &amp; Sinonim
              </Title>
            </Group>
            <Group gap="xs">
              {word.related_words.map((rel) => (
                <Badge
                  key={rel.word_id}
                  component={Link}
                  to={`/words/${encodeURIComponent(rel.lemma)}`}
                  size="lg"
                  variant="outline"
                >
                  {rel.lemma}{' '}
                  <Text size="xs" c="dimmed" fs="italic" span>
                    ({rel.relation_type})
                  </Text>
                </Badge>
              ))}
            </Group>
          </Stack>
        )}

        {/* Morphological Variants */}
        {word.variants.length > 0 && (
          <Stack gap="sm">
            <Divider />
            <Group gap="xs">
              <Layers size={16} />
              <Title order={2} size="h5" c="dimmed" tt="uppercase" fw={700}>
                Variasi &amp; Bentukan Kata
              </Title>
            </Group>
            <Group gap="xs">
              {word.variants.map((v) => (
                <Badge key={v.id} size="sm" variant="light">
                  {v.form}{' '}
                  <Text size="xs" c="dimmed" span>
                    ({v.variant_type})
                  </Text>
                </Badge>
              ))}
            </Group>
          </Stack>
        )}

        {(word.created_by?.username || word.verified_by?.username) && (
          <Stack gap={4}>
            <Divider />
            {word.created_by?.username &&
            word.verified_by?.username &&
            word.created_by.username === word.verified_by.username ? (
              <Group gap={6} wrap="wrap">
                <Text size="xs" c="dimmed">
                  Dibuat dan diverifikasi oleh {word.created_by.username}
                </Text>
                {['admin', 'editor', 'root', 'reviewer'].includes(
                  word.verified_by.role,
                ) ? (
                  <Badge size="xs" variant="light">
                    Verifikator
                  </Badge>
                ) : null}
              </Group>
            ) : (
              <>
                {word.created_by?.username ? (
                  <Text size="xs" c="dimmed">
                    Dibuat oleh {word.created_by.username}
                  </Text>
                ) : null}
                {word.is_verified && word.verified_by?.username ? (
                  <Text size="xs" c="dimmed">
                    Diverifikasi oleh {word.verified_by.username}
                  </Text>
                ) : null}
              </>
            )}
          </Stack>
        )}

        <Box />
      </Stack>
    </Container>
  );
}
