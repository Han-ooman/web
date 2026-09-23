import { useState } from 'react';
import { Link, useLoaderData } from 'react-router';
import {
  Alert,
  Anchor,
  Button,
  Card,
  Container,
  Group,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { CheckCircle2, Send } from 'lucide-react';
import type { Route } from './+types/kontribusi';
import { buildMetaTags } from '../application/utils/seo';
import { AppError } from '../infrastructure/api/api-client';
import { apiClient } from '../infrastructure/api/api-client';
import {
  listLanguages,
  listWordClasses,
  pickIndonesianLanguage,
  pickSambasLanguage,
} from '../application/use-cases/reference.use-case';

export function meta(_args: Route.MetaArgs) {
  return buildMetaTags({
    title: 'Kontribusi Kata',
    description:
      'Bantu pelestarian bahasa Sambas: kirim kata, padanan, atau definisi baru untuk diverifikasi tim kamus.',
    path: '/kontribusi',
    // Halaman form = thin content, jangan diperebutkan di search engine.
    noindexAlways: true,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const [languages, wordClasses] = await Promise.all([
    listLanguages(request.signal),
    listWordClasses(request.signal),
  ]);
  return { languages, wordClasses };
}

export default function KontribusiPage() {
  const { languages, wordClasses } = useLoaderData<typeof loader>();
  const sambas = pickSambasLanguage(languages);
  const indonesia = pickIndonesianLanguage(languages);

  const [lemma, setLemma] = useState('');
  const [wordClassId, setWordClassId] = useState('');
  const [definition, setDefinition] = useState('');
  const [padanan, setPadanan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordClassOptions = wordClasses.map((wc) => ({
    value: wc.id,
    label: wc.alias ? `${wc.name} (${wc.alias})` : wc.name,
  }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiClient('/contributions/words', {
        method: 'POST',
        body: JSON.stringify({
          lemma: lemma.trim(),
          language_id: sambas?.id,
          word_type: 'word',
          meanings: [
            {
              word_class_id: wordClassId,
              definition: definition.trim(),
              is_have_definition: true,
              is_have_translation: padanan.trim().length > 0,
              order_index: 1,
              translations: padanan.trim()
                ? [
                    {
                      language_id: indonesia?.id,
                      translation_text: padanan.trim(),
                      translation_type: 'direct',
                    },
                  ]
                : [],
            },
          ],
        }),
      });
      setSuccess(true);
      setLemma('');
      setWordClassId('');
      setDefinition('');
      setPadanan('');
    } catch (err) {
      if (err instanceof AppError && err.details?.length) {
        setError(err.details.map((d) => d.message).join('. '));
      } else {
        setError(err instanceof Error ? err.message : 'Gagal mengirim kontribusi.');
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
          Kata yang kamu kirim masuk antrean verifikasi tim kamus sebelum
          ditayangkan. Terima kasih menjaga bahasa Sambas tetap hidup.
        </Text>

        {success && (
          <Alert
            icon={<CheckCircle2 size={18} />}
            color="teal"
            variant="light"
            title="Kontribusi terkirim"
          >
            Kata kamu sudah masuk antrean verifikasi. Lihat perkembangannya di{' '}
            <Anchor component={Link} to="/words" size="sm">
              daftar kata
            </Anchor>{' '}
            setelah diverifikasi.
          </Alert>
        )}

        {error && (
          <Alert color="red" variant="light" title="Gagal mengirim">
            {error}
          </Alert>
        )}

        <Card withBorder radius="md" padding="lg">
          <form onSubmit={onSubmit}>
            <Stack gap="md">
              <TextInput
                label="Kata Sambas"
                placeholder="mis. makatn"
                required
                value={lemma}
                onChange={(e) => setLemma(e.currentTarget.value)}
              />
              <Select
                label="Kelas kata"
                placeholder="Pilih kelas kata"
                required
                data={wordClassOptions}
                value={wordClassId}
                onChange={(v) => setWordClassId(v ?? '')}
              />
              <Textarea
                label="Definisi"
                placeholder="Arti kata dalam bahasa Indonesia"
                required
                minRows={3}
                value={definition}
                onChange={(e) => setDefinition(e.currentTarget.value)}
              />
              <TextInput
                label="Padanan Indonesia (opsional)"
                placeholder="mis. makan"
                value={padanan}
                onChange={(e) => setPadanan(e.currentTarget.value)}
              />
              <Group justify="flex-end">
                <Button
                  type="submit"
                  loading={submitting}
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
