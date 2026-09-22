import { Badge } from '@mantine/core';
import { formatWordType } from '@/application/utils/formatters';
import type { WordType } from '@/domain/entities/word.entity';

const VARIANT_MAP: Record<WordType, { variant: 'light' | 'outline' | 'filled'; color?: string }> = {
  word: { variant: 'light' },
  idiom: { variant: 'outline' },
  peribahasa: { variant: 'light', color: 'green' },
  ungkapan: { variant: 'filled' },
};

export function WordTypeBadge({ type }: { type: WordType }) {
  const { variant, color } = VARIANT_MAP[type] ?? { variant: 'light' as const };
  return (
    <Badge size="sm" variant={variant} color={color}>
      {formatWordType(type)}
    </Badge>
  );
}
