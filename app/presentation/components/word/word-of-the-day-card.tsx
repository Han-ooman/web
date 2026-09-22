import { Link } from 'react-router';
import {
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { WordTypeBadge } from './word-type-badge';
import { formatDateId } from '@/application/utils/formatters';
import type { WordOfTheDay } from '@/domain/entities/word.entity';

export function WordOfTheDayCard({ wordOfDay }: { wordOfDay: WordOfTheDay }) {
  const word = wordOfDay.word;
  if (!word) return null;

  const firstMeaning = word.meanings[0];

  return (
    <Card withBorder padding="lg" radius="md">
      <Stack gap="md">
        <Group justify="space-between" gap="sm" wrap="wrap">
          <Group gap="xs">
            <Badge
              size="sm"
              variant="light"
              color="amber"
              leftSection={<Sparkles size={13} />}
            >
              Kata Hari Ini
            </Badge>
            <Badge size="sm" variant="outline">
              {formatDateId(wordOfDay.date)}
            </Badge>
          </Group>

          {wordOfDay.is_new_this_week && (
            <Badge size="sm" variant="light" color="green">
              Baru Pekan Ini
            </Badge>
          )}
        </Group>

        <Stack gap="xs">
          <Group gap="sm" align="baseline" wrap="wrap">
            <Anchor
              component={Link}
              to={`/words/${word.id}`}
              underline="never"
              c="var(--mantine-color-text)"
            >
              <Title order={3}>{word.lemma}</Title>
            </Anchor>
            <WordTypeBadge type={word.word_type} />
            {firstMeaning?.word_class && (
              <Text size="xs" c="dimmed" fs="italic">
                {firstMeaning.word_class.code} ({firstMeaning.word_class.name})
              </Text>
            )}
          </Group>

          {firstMeaning && (
            <Text c="dimmed" lineClamp={2} maw={640}>
              {firstMeaning.definition}
            </Text>
          )}

          {firstMeaning?.translations && firstMeaning.translations.length > 0 && (
            <Text size="sm" c="dimmed">
              Terjemahan:{' '}
              <Text span fw={500} c="var(--mantine-color-text)">
                {firstMeaning.translations.map((t) => t.translation_text).join(', ')}
              </Text>
            </Text>
          )}
        </Stack>

        <Button
          component={Link}
          to={`/words/${word.id}`}
          variant="light"
          leftSection={<BookOpen size={16} />}
          rightSection={<ArrowRight size={16} />}
          size="xs"
          mt="xs"
          style={{ alignSelf: 'flex-start' }}
        >
          Pelajari Kata Ini
        </Button>
      </Stack>
    </Card>
  );
}
