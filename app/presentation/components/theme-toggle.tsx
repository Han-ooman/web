import { useSyncExternalStore } from 'react';
import {
  ActionIcon,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { Sun, Moon } from 'lucide-react';

function subscribeNoop() {
  return () => {};
}

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme('light');
  // Server/hidrasi: false. Client: true. Ikon mengikuti skema hanya setelah
  // hidrasi supaya markup awal sama dengan HTML server.
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const isDark = mounted && computed === 'dark';

  return (
    <Tooltip
      label={isDark ? 'Tema terang' : 'Tema gelap'}
      position="bottom-end"
    >
      <ActionIcon
        variant="default"
        size="lg"
        aria-label="Ganti tema"
        onClick={() => setColorScheme(computed === 'dark' ? 'light' : 'dark')}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </ActionIcon>
    </Tooltip>
  );
}
