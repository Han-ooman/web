import { Badge, Group } from '@mantine/core';
import {
  PROMINENT_USAGE_LABELS,
  label,
  type UsageLabel,
} from '@/domain/usage-labels';

function badgeStyle(code: UsageLabel): {
  variant: 'light' | 'filled';
  color?: string;
  autoContrast?: boolean;
} {
  if (PROMINENT_USAGE_LABELS.has(code)) {
    // orange-6 + teks putih ~2.6:1. autoContrast membalik ke hitam saat
    // latar terang, jadi badge terisi tetap lolos AA.
    return { variant: 'filled', color: 'orange', autoContrast: true };
  }
  return { variant: 'light' };
}

export function UsageLabelsBadges({
  labels,
  size = 'sm',
}: {
  labels?: readonly UsageLabel[] | null;
  size?: 'xs' | 'sm';
}) {
  if (!labels?.length) return null;

  return (
    <Group gap={4} wrap="wrap">
      {labels.map((code) => {
        const { variant, color, autoContrast } = badgeStyle(code);
        return (
          <Badge
            key={code}
            size={size}
            variant={variant}
            color={color}
            autoContrast={autoContrast}
          >
            {label(code)}
          </Badge>
        );
      })}
    </Group>
  );
}
