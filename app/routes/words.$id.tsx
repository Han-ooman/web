import { useState } from 'react';
import { useLoaderData, useNavigation, Link } from 'react-router';
import {
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
import type { Route } from './+types/words.$id';
import { getWordDetail } from '@/application/use-cases/word.use-case';
import { buildMetaTags, buildWordJsonLd } from '@/application/utils/seo';
import { env } from '@/infrastructure/config/env';
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
  const firstMeaning = word.meanings[0];
  const definition =
    firstMeaning?.definition ?? `Pelajari arti kata ${word.lemma} dalam bahasa Sambas.`;
  const primaryImage = word.images.find((img) => img.is_primary)?.url ?? word.images[0]?.url;

  return buildMetaTags({
    title: `${word.lemma} - Arti Kata Bahasa Sambas`,
    description: `${word.lemma}: ${definition}`,
    path: `/words/${word.id}`,
    image: primaryImage,
    type: 'article',
  });
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { id } = params;
  if (!id) {
    throw new Response('ID kata tidak valid', { status: 400 });
  }

  try {
    const word = await getWordDetail(id, request.signal);
    return { word };
  } catch (error) {
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
              {word.is_verified && (
                <Badge
                  size="sm"
                  variant="light"
                  color="teal"
                  leftSection={<CheckCircle2 size={13} />}
                >
                  Terverifikasi
                </Badge>
              )}
              <WordTypeBadge type={word.word_type} />
            </Group>

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
            <Title order={5} c="dimmed" tt="uppercase" fw={700}>
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
              <Title order={5} c="dimmed" tt="uppercase" fw={700}>
                Kata Terkait &amp; Sinonim
              </Title>
            </Group>
            <Group gap="xs">
              {word.related_words.map((rel) => (
                <Badge
                  key={rel.word_id}
                  component={Link}
                  to={`/words/${rel.word_id}`}
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
              <Title order={5} c="dimmed" tt="uppercase" fw={700}>
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

        <Box />
      </Stack>
    </Container>
  );
}
