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
import { pickSafePrimaryImageUrl } from '@/domain/image-content-warnings';
import { WordTypeBadge } from '@/presentation/components/word/word-type-badge';
import { UsageLabelsBadges } from '@/presentation/components/word/usage-labels-badges';
import { WordImagesGallery } from '@/presentation/components/word/word-images-gallery';
import { WordAudioPlayer } from '@/presentation/components/word/pronunciation-player';
import { formatWordClass } from '@/application/utils/formatters';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
  stripLocalePrefix,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { useLocale, useLocalePath } from '@/application/i18n/use-locale';
import { useTranslation } from 'react-i18next';

export function meta({ data, params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const tWord = getFixedT(locale);
  if (!data?.word) {
    return buildMetaTags({
      title: tWord('word_notFoundTitle'),
      description: tWord('word_notFoundBody'),
      path: localePath(locale, '/words'),
      locale,
    });
  }

  const { word } = data;
  const { title, description } = buildWordSeoCopy(word, locale);
  const rawImage = pickSafePrimaryImageUrl(word.images);
  // Kartu OG dinamis saat tidak ada gambar kata yang aman (pengganti
  // fallback logo.png dari buildMetaTags).
  const primaryImage = rawImage
    ? displayImageUrl(rawImage, { width: 1200 })
    : `${env.appUrl}/og/words/${encodeURIComponent(word.lemma)}`;

  return buildMetaTags({
    title,
    description,
    path: localePath(locale, `/words/${encodeURIComponent(word.lemma)}`),
    image: primaryImage,
    type: 'article',
    locale,
  });
}

// ULID Crockford base32 - 26 karakter. URL lama /words/<ulid> masih
// beredar (backlink/search engine) → 301 permanen ke /words/<lemma>.
const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

export async function loader({ params, request }: Route.LoaderArgs) {
  const { lemma } = params;
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  if (!lemma) {
    throw new Response('Lemma kata tidak valid', { status: 400 });
  }

  try {
    if (ULID_RE.test(lemma)) {
      const word = await getWordDetail(lemma, request.signal);
      throw redirect(
        localePath(locale, `/words/${encodeURIComponent(word.lemma)}`),
        301,
      );
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
  const { t } = useTranslation();
  const lp = useLocalePath();
  const locale = useLocale();

  // Saat pindah ke kata terkait (route sama, :id beda) loader berjalan -
  // tampilkan skeleton agar data kata lama tidak tampil sesaat.
  const navBare = navigation.location
    ? stripLocalePrefix(navigation.location.pathname).path
    : '';
  const isLoadingRelated =
    navigation.state === 'loading' &&
    navBare !== '/words' &&
    navBare.startsWith('/words/');

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

  const jsonLd = buildWordJsonLd(word, locale);

  const handleShare = async () => {
    // Web Share API (mobile): share sheet native. Fallback clipboard.
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const { title: shareTitle } = buildWordSeoCopy(word, locale);
        await navigator.share({
          title: word.lemma,
          text: shareTitle,
          url: window.location.href,
        });
        return;
      } catch {
        // dibatalkan user atau gagal: lanjut fallback clipboard
      }
    }
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
            {word.lemma}
          </Text>
        </Group>

        {/* Navigation & Action Bar */}
        <Group justify="space-between" gap="md">
          <Button
            component={Link}
            to={lp('/words')}
            variant="subtle"
            size="compact-sm"
            leftSection={<ArrowLeft size={15} />}
          >
            {t('word_backToList')}
          </Button>

          <Button
            variant="light"
            size="compact-sm"
            onClick={handleShare}
            leftSection={copied ? <Check size={15} /> : <Share2 size={15} />}
            color={copied ? 'teal' : undefined}
          >
            {copied ? t('word_shareCopied') : t('word_share')}
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
              <UsageLabelsBadges labels={word.usage_labels} />
            </Group>
            {/* Teks SSR untuk query "{lemma} bahasa sambas" - jangan client-only. */}
            <Text size="sm" c="dimmed">
              {t('word_leadSentence', { lemma: word.lemma })}
            </Text>
            {!word.is_verified ? (
              <Text size="sm" c="dimmed">
                {t('word_unverifiedNotice')}
              </Text>
            ) : null}

            {/* Notasi IPA (teks) + audio multi-take dari word_audios */}
            {word.pronunciations.length > 0 && (
              <Group gap="sm" wrap="wrap">
                <Group gap={4} wrap="nowrap">
                  <Volume2 size={14} opacity={0.6} />
                  <Text size="xs" c="dimmed">
                    {t('word_pronunciationLabel')}
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
                {t('word_notesLabel')} {word.notes}
              </Text>
            </Paper>
          )}
          <Divider />
        </Stack>

        <WordImagesGallery
          wordId={word.id}
          images={word.images}
          lemma={word.lemma}
        />

        {/* Meanings & Translations */}
        <Stack gap="md">
          <Group gap="xs">
            <BookOpen size={16} />
            <Title order={2} size="h5" c="dimmed" tt="uppercase" fw={700}>
              {t('word_meaningsHeading', { count: word.meanings.length })}
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
                        {t('word_translationsLabel')}
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
                        {t('word_examplesLabel')}
                      </Text>
                      {meaning.examples.map((ex) => (
                        <Stack key={ex.id} gap={2}>
                          <Blockquote p="sm" fs="italic" bd="xs">
                            {ex.source_sentence}
                          </Blockquote>
                          {ex.target_sentence && (
                            <Text size="xs" c="dimmed" pl="md">
                              {t('word_exampleMeans')} &quot;{ex.target_sentence}&quot;
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
                {t('word_relatedTitle')}
              </Title>
            </Group>
            <Group gap="xs">
              {word.related_words.map((rel) => (
                <Badge
                  key={rel.word_id}
                  component={Link}
                  to={lp(`/words/${encodeURIComponent(rel.lemma)}`)}
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
                  {t('word_createdVerifiedBy', {
                    username: word.created_by.username,
                  })}
                </Text>
                {['admin', 'editor', 'root', 'reviewer'].includes(
                  word.verified_by.role,
                ) ? (
                  <Badge size="xs" variant="light">
                    {t('word_verifierBadge')}
                  </Badge>
                ) : null}
              </Group>
            ) : (
              <>
                {word.created_by?.username ? (
                  <Text size="xs" c="dimmed">
                    {t('word_createdBy', {
                      username: word.created_by.username,
                    })}
                  </Text>
                ) : null}
                {word.is_verified && word.verified_by?.username ? (
                  <Text size="xs" c="dimmed">
                    {t('word_verifiedBy', {
                      username: word.verified_by.username,
                    })}
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
