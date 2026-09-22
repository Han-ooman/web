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

  return (
    <Tooltip
      label={computed === 'dark' ? 'Tema terang' : 'Tema gelap'}
      position="bottom-end"
    >
      <ActionIcon
        variant="default"
        size="lg"
        aria-label="Ganti tema"
        onClick={() => setColorScheme(computed === 'dark' ? 'light' : 'dark')}
      >
        {computed === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </ActionIcon>
    </Tooltip>
  );
}
