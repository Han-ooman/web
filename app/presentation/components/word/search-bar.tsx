import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ActionIcon,
  Button,
  Group,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  initialQuery?: string;
  initialDirection?: 'lemma' | 'translation';
  autoFocus?: boolean;
}

export function SearchBar({
  initialQuery = '',
  initialDirection = 'lemma',
  autoFocus = false,
}: SearchBarProps) {
  const [q, setQ] = useState(initialQuery);
  const [direction, setDirection] = useState<'lemma' | 'translation'>(initialDirection);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;

    navigate(`/search?q=${encodeURIComponent(query)}&search_in=${direction}`);
  };

  return (
    <form onSubmit={handleSearch} style={{ width: '100%' }}>
      <Stack gap="xs" w="100%" maw={640} mx="auto">
        <TextInput
          data-autofocus={autoFocus ? true : undefined}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            direction === 'lemma'
              ? 'Cari kosakata Sambas...'
              : 'Cari dari bahasa Indonesia (mis. makan, kue)...'
          }
          size="md"
          leftSection={<Search size={16} />}
          rightSectionWidth={q ? 110 : 84}
          rightSection={
            <Group gap={4} wrap="nowrap" pr={4}>
              {q && (
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={() => setQ('')}
                  aria-label="Bersihkan pencarian"
                >
                  <X size={14} />
                </ActionIcon>
              )}
              <Button
                type="submit"
                size="compact-sm"
                leftSection={<Search size={14} />}
              >
                Cari
              </Button>
            </Group>
          }
        />

        <Group justify="space-between" gap="sm" wrap="nowrap">
          <SegmentedControl
            size="xs"
            value={direction}
            onChange={(value) => setDirection(value as 'lemma' | 'translation')}
            data={[
              { value: 'lemma', label: 'Sambas → Indonesia' },
              { value: 'translation', label: 'Indonesia → Sambas' },
            ]}
          />
          <Text size="xs" c="dimmed" visibleFrom="sm" style={{ whiteSpace: 'nowrap' }}>
            Tekan Enter untuk mencari
          </Text>
        </Group>
      </Stack>
    </form>
  );
}
