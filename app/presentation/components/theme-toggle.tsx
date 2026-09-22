import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme('light');
  // Server selalu merender skema default; nilai localStorage baru terbaca
  // setelah mount - gate ikon agar tidak hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
