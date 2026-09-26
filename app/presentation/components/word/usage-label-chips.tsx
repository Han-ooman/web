import { Badge, Group, Text, UnstyledButton } from '@mantine/core';
import {
  PROMINENT_USAGE_LABELS,
  USAGE_LABEL_LABELS,
  type UsageLabel,
} from '@/domain/usage-labels';

/**
 * Multi-select chip untuk usage_labels - padanan web dari chip mobile
 * (bukan Checkbox form yang terasa kasar di UI awam).
 */
export function UsageLabelChips({
  options,
  selected,
  onToggle,
  caption,
}: {
  options: readonly UsageLabel[];
  selected: readonly UsageLabel[];
  onToggle: (code: UsageLabel) => void;
  caption?: string;
}) {
  return (
    <div>
      {caption ? (
        <Text size="xs" c="dimmed" mb={6}>
          {caption}
        </Text>
      ) : null}
      <Group gap={6} wrap="wrap">
        {options.map((code) => {
          const isOn = selected.includes(code);
          const prominent = PROMINENT_USAGE_LABELS.has(code);
          return (
            <UnstyledButton
              key={code}
              type="button"
              onClick={() => onToggle(code)}
              aria-pressed={isOn}
              style={{ borderRadius: 'var(--mantine-radius-xl)' }}
            >
              <Badge
                size="md"
                radius="xl"
                variant={isOn ? (prominent ? 'filled' : 'light') : 'outline'}
                color={isOn ? (prominent ? 'orange' : 'teal') : 'gray'}
                style={{
                  cursor: 'pointer',
                  textTransform: 'none',
                  fontWeight: isOn ? 600 : 500,
                }}
              >
                {USAGE_LABEL_LABELS[code]}
              </Badge>
            </UnstyledButton>
          );
        })}
      </Group>
    </div>
  );
}
