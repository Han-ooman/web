import { useEffect, useState } from 'react';
import { Link, useLoaderData, useSearchParams } from 'react-router';
import {
  ActionIcon,
  Alert,
  Anchor,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Modal,
  SegmentedControl,
  Skeleton,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { BookOpenText, Check, Info, Plus, Send, Trash2 } from 'lucide-react';
import type { Route } from './+types/kontribusi';
import { buildMetaTags } from '../application/utils/seo';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { useLocalePath } from '@/application/i18n/use-locale';

import {
  lookupKbbi,
  searchWords,
  type KbbiSuggestion,
} from '../application/use-cases/word.use-case';
import { AppError, apiClient } from '../infrastructure/api/api-client';
import type { WordSummary } from '../domain/entities/word.entity';
import {
  hasConflictingUsageLabels,
  REGISTER_LABELS,
  WARNING_LABELS,
  type UsageLabel,
} from '../domain/usage-labels';
import { UsageLabelChips } from '../presentation/components/word/usage-label-chips';
import {
  ContributionImagesField,
  type ContributionImageSlot,
} from '../presentation/components/media-explorer/contribution-images-field';
import { isAllowedDisplayImageUrl } from '../presentation/utils/display-image-url';
import {
  listDialects,
  listLanguages,
  listWordClasses,
  pickDefaultDialectId,
  pickIndonesianLanguage,
  pickSambasLanguage,
  pickUmumWordClassId,
} from '../application/use-cases/reference.use-case';

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  return buildMetaTags({
    title: 'Kontribusi Kata',
    description:
      'Bantu pelestarian bahasa Sambas: kirim kata, makna, terjemahan, atau contoh baru untuk diverifikasi tim kamus.',
    path: localePath(locale, '/kontribusi'),
    locale,
    // Halaman form = thin content, jangan diperebutkan di search engine.
    noindexAlways: true,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const [languages, wordClasses] = await Promise.all([
    listLanguages(request.signal),
    listWordClasses(request.signal),
  ]);
  const sambas = pickSambasLanguage(languages);
  const dialects = sambas ? await listDialects(sambas.id, request.signal) : [];
  return { languages, wordClasses, dialects };
}

interface MaknaForm {
  wordClassId: string;
  definition: string;
  padanan: string;
  contoh: string;
}

const emptyMakna: MaknaForm = {
  wordClassId: '',
  definition: '',
  padanan: '',
  contoh: '',
};

// Kode kelas kata KBBI lebih pendek dari DB (a vs adj, p vs part) -
// alias + fallback nama label agar auto-fill tetap jalan.
const KBBI_CODE_ALIASES: Record<string, string> = { a: 'adj', p: 'part' };

const EMPTY_KBBI: KbbiSuggestion[] = [];
const EMPTY_WORDS: WordSummary[] = [];

function searchSimilarLemmas(q: string): Promise<WordSummary[]> {
  return searchWords({ q, searchIn: 'lemma', limit: 5 }).then(
    (res) => res.data,
  );
}

/**
 * Debounce pencarian. Hasil pendek / belum siap dihitung saat render,
 * setState hanya di callback timeout - bukan sinkron di badan effect.
 */
function useDebouncedQuery<T>(
  rawQuery: string,
  minLength: number,
  delayMs: number,
  lookup: (q: string) => Promise<T>,
  empty: T,
  hiddenQuery: string | null = null,
): { data: T; loading: boolean; error: boolean } {
  const [settled, setSettled] = useState<{
    q: string;
    data: T;
    error: boolean;
  } | null>(null);
  const q = rawQuery.trim();
  const active = q.length >= minLength && hiddenQuery !== q;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      lookup(q).then(
        (data) => {
          if (!cancelled) setSettled({ q, data, error: false });
        },
        () => {
          if (!cancelled) setSettled({ q, data: empty, error: true });
        },
      );
    }, delayMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active, q, delayMs, empty, lookup]);

  if (!active) return { data: empty, loading: false, error: false };
  if (settled?.q !== q) {
    const stale =
      settled && !settled.error && settled.q !== hiddenQuery
        ? settled.data
        : empty;
    return { data: stale, loading: true, error: false };
  }
  return {
    data: settled.error ? empty : settled.data,
    loading: false,
    error: settled.error,
  };
}

function matchWordClass(
  s: KbbiSuggestion,
  wordClasses: { id: string; code: string; name: string }[],
) {
  const code = KBBI_CODE_ALIASES[s.word_class_code ?? ''] ?? s.word_class_code;
  return (
    (code ? wordClasses.find((w) => w.code === code) : undefined) ??
    (s.word_class_label
      ? wordClasses.find(
          (w) => w.name.toLowerCase() === s.word_class_label!.toLowerCase(),
        )
      : undefined)
  );
}

/**
 * Modal pencarian KBBI - padanan web untuk bottom sheet (mobile) dan
 * modal (admin). Buka lewat ikon buku di samping field padanan.
 */
function KbbiLookupModal({
  opened,
  onClose,
  onSelect,
  initialQuery = '',
}: {
  opened: boolean;
  onClose: () => void;
  onSelect: (s: KbbiSuggestion) => void;
  initialQuery?: string;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Cari di KBBI"
      size="lg"
      centered
    >
      {opened ? (
        <KbbiLookupFields
          initialQuery={initialQuery}
          onClose={onClose}
          onSelect={onSelect}
        />
      ) : null}
    </Modal>
  );
}

function KbbiLookupFields({
  initialQuery,
  onClose,
  onSelect,
}: {
  initialQuery: string;
  onClose: () => void;
  onSelect: (s: KbbiSuggestion) => void;
}) {
  // Mount ulang tiap modal dibuka, jadi query awal selalu segar.
  const [query, setQuery] = useState(initialQuery);
  const {
    data: results,
    loading,
    error,
  } = useDebouncedQuery(query, 2, 400, lookupKbbi, EMPTY_KBBI);

  return (
    <Stack gap="sm">
      <TextInput
        data-autofocus
        placeholder="Kata bahasa Indonesia, mis. makan"
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        leftSection={<BookOpenText size={16} />}
      />

      {loading && (
        <Stack gap={4}>
          <Skeleton height={44} radius="sm" />
          <Skeleton height={44} radius="sm" />
          <Skeleton height={44} radius="sm" />
        </Stack>
      )}

      {error && (
        <Text size="sm" c="red">
          Gagal menghubungi KBBI. Coba lagi sebentar.
        </Text>
      )}

      {!loading &&
        !error &&
        query.trim().length >= 2 &&
        results.length === 0 && (
          <Text size="sm" c="dimmed">
            Tidak ditemukan di KBBI. Isi definisi secara manual.
          </Text>
        )}

      <Stack gap={4}>
        {results.map((s) => (
          <Paper
            key={s.id}
            component="button"
            type="button"
            withBorder
            radius="sm"
            p="sm"
            onClick={() => {
              onSelect(s);
              onClose();
            }}
            style={{ textAlign: 'left', cursor: 'pointer' }}
          >
            <Group gap="xs" align="baseline" wrap="nowrap">
              <Text
                size="xs"
                fw={600}
                c="dimmed"
                style={{ whiteSpace: 'nowrap' }}
              >
                {s.word_class_label ?? '-'}
              </Text>
              <Text size="sm" lineClamp={2}>
                {s.definition}
              </Text>
            </Group>
          </Paper>
        ))}
      </Stack>

      <Box />
    </Stack>
  );
}

/** Satu kartu makna + trigger KBBI (debounce di field padanan Indonesia). */
function MaknaCard({
  index,
  value,
  wordClassOptions,
  wordClasses,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number;
  value: MaknaForm;
  wordClassOptions: { value: string; label: string }[];
  wordClasses: { id: string; code: string; name: string }[];
  onChange: (v: MaknaForm) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [kbbiOpen, setKbbiOpen] = useState(false);
  // Setelah user memilih saran, sembunyikan daftar untuk query yang sama.
  const [dismissedQ, setDismissedQ] = useState<string | null>(null);
  const { data: kbbi, loading: kbbiLoading } = useDebouncedQuery(
    value.padanan,
    2,
    500,
    lookupKbbi,
    EMPTY_KBBI,
    dismissedQ,
  );

  function applySuggestion(s: KbbiSuggestion) {
    const wc = matchWordClass(s, wordClasses);
    onChange({
      ...value,
      wordClassId: wc?.id ?? value.wordClassId,
      definition: s.definition,
    });
    setDismissedQ(value.padanan.trim());
  }

  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="md">
        <Text fw={600} size="sm" c="dimmed">
          Makna {index + 1}
        </Text>
        {canRemove && (
          <Tooltip label="Hapus makna ini">
            <ActionIcon
              color="red"
              variant="subtle"
              onClick={onRemove}
              aria-label="Hapus makna"
            >
              <Trash2 size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      <Stack gap="md">
        <Group grow align="flex-start" wrap="wrap">
          <Select
            // key: Select searchable menyimpan teks input secara internal
            // dan tidak ikut bersih saat value direset dari luar (bug reset
            // pasca-submit) - remount saat kosong menjamin tampilan bersih.
            key={`wc-${value.wordClassId || 'empty'}`}
            label="Kelas kata"
            placeholder="Pilih kelas kata"
            required
            searchable
            data={wordClassOptions}
            value={value.wordClassId}
            onChange={(v) => onChange({ ...value, wordClassId: v ?? '' })}
            style={{ minWidth: 180 }}
          />
          <TextInput
            label="Terjemahan Indonesia"
            placeholder="mis. makan"
            value={value.padanan}
            onChange={(e) =>
              onChange({ ...value, padanan: e.currentTarget.value })
            }
            style={{ minWidth: 180 }}
            rightSectionWidth={44}
            rightSection={
              <Tooltip label="Cari definisi di KBBI" position="top" withArrow>
                <ActionIcon
                  variant="subtle"
                  onClick={() => setKbbiOpen(true)}
                  aria-label="Cari definisi di KBBI"
                  style={{ marginRight: 6 }}
                >
                  <BookOpenText size={16} />
                </ActionIcon>
              </Tooltip>
            }
          />
        </Group>

        {/* Hint di baris sendiri (bukan description field) supaya layout
            horizontal Select + TextInput tidak bergeser oleh teks panjang. */}
        <Text size="xs" c="dimmed" mt={-8}>
          Ketik kata Indonesia - saran definisi KBBI muncul otomatis, atau klik
          ikon buku untuk mencari sendiri.
        </Text>

        <KbbiLookupModal
          opened={kbbiOpen}
          onClose={() => setKbbiOpen(false)}
          initialQuery={value.padanan.trim()}
          onSelect={(s) => {
            const wc = matchWordClass(s, wordClasses);
            onChange({
              ...value,
              wordClassId: wc?.id ?? value.wordClassId,
              definition: s.definition,
              // Pilihan di modal adalah kata yang dicari, bukan isi field
              // sebelumnya. "makan" lalu pilih "minum" harus menimpa field.
              padanan: s.lemma.trim() || value.padanan,
            });
          }}
        />

        {(kbbi.length > 0 || kbbiLoading) && (
          <Paper withBorder radius="sm" p="sm" bg="var(--mantine-color-body)">
            <Group gap="xs" mb={6}>
              <BookOpenText size={14} />
              <Text size="xs" fw={600} c="dimmed">
                {kbbiLoading
                  ? 'Mencari di KBBI…'
                  : 'Definisi KBBI - klik untuk isi otomatis'}
              </Text>
            </Group>
            <Stack gap={2}>
              {kbbiLoading && <Skeleton height={14} radius="sm" mt={4} />}
              {kbbi.slice(0, 4).map((s) => (
                <Anchor
                  key={s.id}
                  component="button"
                  type="button"
                  size="sm"
                  onClick={() => applySuggestion(s)}
                  ta="left"
                  underline="never"
                  px={6}
                  py={4}
                  style={{ borderRadius: 'var(--mantine-radius-sm)' }}
                >
                  <Text span size="xs" c="dimmed" mr={4}>
                    {s.word_class_label ?? '-'}
                  </Text>
                  {s.preview}
                </Anchor>
              ))}
            </Stack>
          </Paper>
        )}

        <Textarea
          label="Definisi"
          placeholder="Arti kata dalam bahasa Indonesia"
          required
          minRows={2}
          value={value.definition}
          onChange={(e) =>
            onChange({ ...value, definition: e.currentTarget.value })
          }
        />

        <Textarea
          label="Contoh kalimat (opsional)"
          description="Pemakaian dalam kalimat bahasa Sambas - sangat membantu verifikator"
          placeholder="mis. kalimat pemakaian kata ini"
          autosize
          minRows={2}
          value={value.contoh}
          onChange={(e) =>
            onChange({ ...value, contoh: e.currentTarget.value })
          }
        />
      </Stack>
    </Paper>
  );
}

export default function KontribusiPage() {
  const lp = useLocalePath();

  const { languages, wordClasses, dialects } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const sambas = pickSambasLanguage(languages);
  const indonesia = pickIndonesianLanguage(languages);
  const umumWordClassId = pickUmumWordClassId(wordClasses);
  const defaultDialectId = pickDefaultDialectId(dialects);

  const [lemma, setLemma] = useState(searchParams.get('q')?.trim() ?? '');
  /** false = Sederhana (lemma + terjemahan). true = form makna lengkap. */
  const [advanced, setAdvanced] = useState(false);
  const [standardPadanan, setStandardPadanan] = useState('');
  const [standardDefinition, setStandardDefinition] = useState('');
  const [standardWordClassId, setStandardWordClassId] =
    useState(umumWordClassId);
  const [standardKbbiOpen, setStandardKbbiOpen] = useState(false);
  const [usageLabels, setUsageLabels] = useState<UsageLabel[]>([]);
  const [maknaList, setMaknaList] = useState<MaknaForm[]>([
    { ...emptyMakna, wordClassId: umumWordClassId },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ContributionImageSlot[]>([]);

  const usageLabelsConflict = hasConflictingUsageLabels(usageLabels);

  function switchMode(nextAdvanced: boolean) {
    const turningOn = nextAdvanced && !advanced;
    if (turningOn) {
      setMaknaList((list) => {
        const first = list[0] ?? {
          ...emptyMakna,
          wordClassId: umumWordClassId,
        };
        // Jangan timpa makna yang sudah diisi user di mode Lengkap.
        const alreadyFilled =
          first.padanan.trim().length > 0 || first.definition.trim().length > 0;
        if (alreadyFilled) return list.length ? list : [first];
        const seeded: MaknaForm = {
          ...first,
          padanan: standardPadanan.trim() || first.padanan,
          definition: standardDefinition.trim() || first.definition,
          wordClassId:
            standardWordClassId || first.wordClassId || umumWordClassId,
        };
        return list.length ? [seeded, ...list.slice(1)] : [seeded];
      });
    }
    setAdvanced(nextAdvanced);
  }

  function toggleUsageLabel(code: UsageLabel) {
    setUsageLabels((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  // ==== Cek duplikat live (debounce 400ms) ====
  // Lemma yang sudah tayang → tawarkan lihat halamannya / ajukan makna
  // baru (verifikator menggabungkan, bukan menolak).
  const { data: similar } = useDebouncedQuery(
    lemma,
    2,
    400,
    searchSimilarLemmas,
    EMPTY_WORDS,
  );

  const exact = similar.find(
    (w) => w.lemma.trim().toLowerCase() === lemma.trim().toLowerCase(),
  );

  const wordClassOptions = wordClasses.map((wc) => ({
    value: wc.id,
    label: wc.alias ? `${wc.name} (${wc.alias})` : wc.name,
  }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (hasConflictingUsageLabels(usageLabels)) {
      setError('Halus dan Kasar tidak bisa dipilih bersamaan.');
      return;
    }
    if (!advanced) {
      if (!standardPadanan.trim()) {
        setError('Isi terjemahan bahasa Indonesia.');
        return;
      }
    }
    // Guard terakhir sebelum POST. `ContributionImagesField` sudah menolak
    // URL di luar allowlist saat dipilih, tapi state React bukan batas
    // keamanan - payload ini bisa diubah dari devtools. Tolak apa pun yang
    // tidak lolos, lalu beri tahu kontributor daripada diam-diam
    // kehilangan fotonya.
    const safeImages = images.filter((img) =>
      isAllowedDisplayImageUrl(img.url),
    );
    if (safeImages.length !== images.length) {
      setError(
        'Sebagian foto ditolak karena berasal dari sumber di luar daftar foto stock yang diizinkan. Hapus foto tersebut lalu kirim ulang.',
      );
      return;
    }
    setSubmitting(true);
    try {
      const word = lemma.trim();
      const def = standardDefinition.trim();
      const meanings = advanced
        ? maknaList.map((m, i) => ({
            word_class_id: m.wordClassId,
            definition: m.definition.trim(),
            is_have_definition: true,
            is_have_translation: m.padanan.trim().length > 0,
            order_index: i + 1,
            translations: m.padanan.trim()
              ? [
                  {
                    language_id: indonesia?.id,
                    translation_text: m.padanan.trim(),
                    translation_type: 'direct' as const,
                  },
                ]
              : [],
            ...(m.contoh.trim()
              ? {
                  examples: [
                    {
                      source_language_id: sambas?.id,
                      source_sentence: m.contoh.trim(),
                      target_language_id: indonesia?.id,
                      source_type: 'native_speaker',
                    },
                  ],
                }
              : {}),
          }))
        : [
            {
              word_class_id: standardWordClassId || umumWordClassId,
              definition: def || '-',
              is_have_definition: def.length > 0,
              is_have_translation: true,
              order_index: 1,
              translations: [
                {
                  language_id: indonesia?.id,
                  translation_text: standardPadanan.trim(),
                  translation_type: 'direct' as const,
                },
              ],
            },
          ];

      await apiClient('/contributions/words', {
        method: 'POST',
        body: JSON.stringify({
          lemma: word,
          language_id: sambas?.id,
          ...(defaultDialectId ? { dialect_id: defaultDialectId } : {}),
          word_type: 'word',
          usage_labels: usageLabels,
          meanings,
          ...(safeImages.length > 0
            ? {
                images: safeImages.map((img) => ({
                  url: img.url,
                  provider: img.provider,
                  provider_file_id: img.provider_file_id,
                  alt_text: img.alt_text.trim() || undefined,
                  is_primary: img.is_primary,
                })),
              }
            : {}),
        }),
      });
      setSuccess(word);
      setLemma('');
      setUsageLabels([]);
      setStandardPadanan('');
      setStandardDefinition('');
      setStandardWordClassId(umumWordClassId);
      setMaknaList([{ ...emptyMakna, wordClassId: umumWordClassId }]);
      setImages([]);
    } catch (err) {
      if (err instanceof AppError && err.details?.length) {
        setError(err.details.map((d) => d.message).join('. '));
      } else {
        setError(
          err instanceof Error ? err.message : 'Gagal mengirim kontribusi.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1} ta="center">
          Kontribusi Kata
        </Title>
        <Text c="dimmed" ta="center">
          Dikirim sebagai tamu. Kata belum tayang. Tim akan memeriksanya dulu.
          Terima kasih menjaga bahasa Sambas tetap hidup.
        </Text>

        {success && (
          <Paper withBorder radius="md" p="md">
            <Group align="flex-start" wrap="nowrap" gap="sm">
              <ThemeIcon
                variant="light"
                color="green"
                size={36}
                radius="md"
                style={{ flexShrink: 0 }}
              >
                <Check size={20} strokeWidth={2.5} />
              </ThemeIcon>
              <Stack gap={4}>
                <Text fw={600} lh={1.35}>
                  &quot;{success}&quot; dikirim sebagai tamu
                </Text>
                <Text size="sm" c="dimmed" lh={1.55}>
                  Kata belum tayang. Tim akan memeriksanya dulu, lalu
                  menampilkannya di{' '}
                  <Anchor component={Link} to={lp('/words')} size="sm">
                    daftar kata
                  </Anchor>
                  . Kalau kata yang sama sudah ada, makna baru akan digabungkan
                  ke halamannya.
                </Text>
              </Stack>
            </Group>
          </Paper>
        )}

        {error && (
          <Alert color="red" variant="light" title="Gagal mengirim">
            {error}
          </Alert>
        )}

        <Card withBorder radius="md" padding="lg">
          <form onSubmit={onSubmit}>
            <Stack gap="md">
              <Stack gap={6}>
                <Text size="sm" fw={500}>
                  Cara mengisi
                </Text>
                <SegmentedControl
                  fullWidth
                  value={advanced ? 'lengkap' : 'sederhana'}
                  onChange={(v) => switchMode(v === 'lengkap')}
                  data={[
                    { label: 'Sederhana', value: 'sederhana' },
                    { label: 'Lengkap', value: 'lengkap' },
                  ]}
                />
              </Stack>

              <TextInput
                label="Kata / ungkapan Sambas"
                placeholder="Isi kata, peribahasa, atau ungkapan"
                required
                value={lemma}
                onChange={(e) => setLemma(e.currentTarget.value)}
              />

              {exact && (
                <Alert
                  icon={<Info size={18} />}
                  color="blue"
                  variant="light"
                  title="Kata ini sudah ada di kamus"
                >
                  <Anchor
                    component={Link}
                    to={lp(`/words/${encodeURIComponent(exact.lemma)}`)}
                    size="sm"
                    fw={600}
                  >
                    Lihat halaman &quot;{exact.lemma}&quot;
                  </Anchor>
                  . Kamu tetap bisa mengajukan <b>makna baru</b> untuk kata ini
                  - verifikator akan menggabungkannya, bukan menolak.
                </Alert>
              )}

              {!exact && similar.length > 0 && (
                <Alert icon={<Info size={18} />} color="gray" variant="light">
                  Kata mirip yang sudah ada:{' '}
                  {similar.map((w, i) => (
                    <span key={w.id}>
                      {i > 0 && ', '}
                      <Anchor
                        component={Link}
                        to={lp(`/words/${encodeURIComponent(w.lemma)}`)}
                        size="sm"
                      >
                        {w.lemma}
                      </Anchor>
                    </span>
                  ))}
                </Alert>
              )}

              {!advanced && (
                <Stack gap="md">
                  <TextInput
                    label="Terjemahan Indonesia"
                    placeholder="Satu kata/frasa setara di Indonesia"
                    description="Tekan ikon buku untuk mencari definisi di KBBI"
                    required
                    value={standardPadanan}
                    onChange={(e) => setStandardPadanan(e.currentTarget.value)}
                    rightSectionWidth={44}
                    rightSection={
                      <Tooltip
                        label="Cari definisi di KBBI"
                        position="top"
                        withArrow
                      >
                        <ActionIcon
                          variant="subtle"
                          onClick={() => setStandardKbbiOpen(true)}
                          aria-label="Cari definisi di KBBI"
                          style={{ marginRight: 6 }}
                        >
                          <BookOpenText size={16} />
                        </ActionIcon>
                      </Tooltip>
                    }
                  />

                  <KbbiLookupModal
                    opened={standardKbbiOpen}
                    onClose={() => setStandardKbbiOpen(false)}
                    initialQuery={standardPadanan.trim()}
                    onSelect={(s) => {
                      const wc = matchWordClass(s, wordClasses);
                      setStandardPadanan(s.lemma.trim() || standardPadanan);
                      setStandardDefinition(s.definition);
                      if (wc?.id) setStandardWordClassId(wc.id);
                    }}
                  />

                  {standardDefinition.trim().length > 0 && (
                    <Stack gap={4}>
                      <Text size="sm" fw={500}>
                        Penjelasan arti
                      </Text>
                      <Paper
                        withBorder
                        radius="sm"
                        p="sm"
                        bg="var(--mantine-color-body)"
                      >
                        <Text size="sm">{standardDefinition}</Text>
                      </Paper>
                      <Text size="xs" c="dimmed">
                        Diisi dari KBBI. Buka mode Lengkap bila ingin mengedit.
                      </Text>
                    </Stack>
                  )}
                </Stack>
              )}

              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Gaya bahasa & peringatan
                </Text>
                <Text size="xs" c="dimmed">
                  Opsional. Ketuk yang sesuai - bantu pembaca paham gaya dan
                  sensitivitas isi.
                </Text>
                <UsageLabelChips
                  caption="Gaya bahasa"
                  options={REGISTER_LABELS}
                  selected={usageLabels}
                  onToggle={toggleUsageLabel}
                />
                <UsageLabelChips
                  caption="Peringatan"
                  options={WARNING_LABELS}
                  selected={usageLabels}
                  onToggle={toggleUsageLabel}
                />
                {usageLabelsConflict && (
                  <Text size="xs" c="red">
                    Halus dan Kasar tidak bisa dipilih bersamaan.
                  </Text>
                )}
              </Stack>

              <Divider label="Gambar" labelPosition="center" />
              <ContributionImagesField images={images} onChange={setImages} />

              {advanced && (
                <>
                  <Divider label="Makna" labelPosition="center" />

                  {maknaList.map((m, i) => (
                    <MaknaCard
                      key={i}
                      index={i}
                      value={m}
                      wordClassOptions={wordClassOptions}
                      wordClasses={wordClasses}
                      onChange={(v) =>
                        setMaknaList((list) =>
                          list.map((x, j) => (j === i ? v : x)),
                        )
                      }
                      onRemove={() =>
                        setMaknaList((list) => list.filter((_, j) => j !== i))
                      }
                      canRemove={maknaList.length > 1}
                    />
                  ))}

                  <Button
                    variant="light"
                    color="gray"
                    leftSection={<Plus size={16} />}
                    onClick={() =>
                      setMaknaList((list) => [
                        ...list,
                        { ...emptyMakna, wordClassId: umumWordClassId },
                      ])
                    }
                  >
                    Tambah Makna Lain
                  </Button>
                </>
              )}

              <Group justify="flex-end">
                <Button
                  type="submit"
                  loading={submitting}
                  disabled={usageLabelsConflict}
                  leftSection={<Send size={16} />}
                >
                  Kirim Kontribusi
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>
      </Stack>
    </Container>
  );
}
