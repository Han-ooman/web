import { Card, Group, Skeleton, Stack } from '@mantine/core';

/** Skeleton baris kata - dipakai saat navigasi/loading antar halaman list. */
export function WordCardSkeleton() {
  return (
    <Card withBorder padding="sm" radius="md" shadow="none">
      <Group justify="space-between" gap="md" wrap="nowrap" align="center">
        <Skeleton height={22} width="38%" radius="sm" />
        <Group gap="xs" wrap="nowrap">
          <Skeleton height={16} width={90} radius="xl" />
          <Skeleton height={16} width={16} radius="sm" />
        </Group>
      </Group>
    </Card>
  );
}

export function WordListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Stack gap="xs">
      {Array.from({ length: count }, (_, i) => (
        <WordCardSkeleton key={i} />
      ))}
    </Stack>
  );
}
