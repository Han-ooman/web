import { Badge, Group } from '@mantine/core';
import {
  PROMINENT_USAGE_LABELS,
  label,
  type UsageLabel,
} from '@/domain/usage-labels';

function badgeStyle(code: UsageLabel): {
  variant: 'light' | 'filled';
  color?: string;
} {
  if (PROMINENT_USAGE_LABELS.has(code)) {
    return { variant: 'filled', color: 'orange' };
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
        const { variant, color } = badgeStyle(code);
        return (
          <Badge key={code} size={size} variant={variant} color={color}>
            {label(code)}
          </Badge>
        );
      })}
    </Group>
  );
}
