import { Link } from 'react-router';
import { Badge, Card, Group, Text } from '@mantine/core';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { WordTypeBadge } from './word-type-badge';
import type { WordSummary } from '@/domain/entities/word.entity';

export function WordCard({ word }: { word: WordSummary }) {
  return (
    <Card
      component={Link}
      to={`/words/${word.id}`}
      withBorder
      padding="sm"
      radius="md"
      shadow="none"
    >
      <Group justify="space-between" gap="md" wrap="nowrap" align="flex-start">
        <Group gap="xs" wrap="wrap">
          <Text fw={600} size="lg" component="span">
            {word.lemma}
          </Text>
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

        <Group gap="xs" wrap="nowrap" align="center">
          {word.matched_translation && (
            <Text size="sm" c="dimmed" lineClamp={1} component="span">
              {word.matched_translation}
            </Text>
          )}
          <ArrowRight size={16} opacity={0.5} />
        </Group>
      </Group>
    </Card>
  );
}
