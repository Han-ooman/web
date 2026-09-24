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
import { useTranslation } from 'react-i18next';
import { useLocalePath } from '@/application/i18n/use-locale';

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
  const { t } = useTranslation();
  const lp = useLocalePath();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;

    navigate(
      lp(
        '/search',
        `?q=${encodeURIComponent(query)}&search_in=${direction}`,
      ),
    );
  };

  return (
    <form onSubmit={handleSearch} style={{ width: '100%' }}>
      <Stack gap="xs" w="100%" maw={640} mx="auto">
        <TextInput
          data-autofocus={autoFocus ? true : undefined}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            direction === 'lemma' ? t('search_placeholderLemma') : t('search_placeholderTranslation')
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
                  aria-label={t('search_clearAria')}
                >
                  <X size={14} />
                </ActionIcon>
              )}
              <Button
                type="submit"
                size="compact-sm"
                leftSection={<Search size={14} />}
              >
                {t('search_submit')}
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
              { value: 'lemma', label: t('search_directionLemma') },
              { value: 'translation', label: t('search_directionTranslation') },
            ]}
          />
          <Text size="xs" c="dimmed" visibleFrom="sm" style={{ whiteSpace: 'nowrap' }}>
            {t('search_pressEnter')}
          </Text>
        </Group>
      </Stack>
    </form>
  );
}
