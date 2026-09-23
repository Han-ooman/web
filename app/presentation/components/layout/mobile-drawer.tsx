import { Anchor, Drawer, Group, Stack } from '@mantine/core';
import { Search, List } from 'lucide-react';
import { Link, useLocation } from 'react-router';

const NAV_ITEMS = [
  { to: '/words', label: 'Daftar Kata A-Z', icon: List },
  { to: '/search', label: 'Cari', icon: Search },
];

/** Drawer navigasi mobile - di-split chunk terpisah (lazy) supaya kode
 *  Drawer Mantine tidak ikut bundle halaman pertama. */
export function MobileDrawer({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <Drawer opened={opened} onClose={onClose} title="Menu" padding="md" size="xs" position="right">
      <Stack gap="xs">
        {NAV_ITEMS.map((item) => (
          <Anchor
            key={item.to}
            component={Link}
            to={item.to}
            // Navigasi client-side tidak memicu onClose - tutup manual
            onClick={onClose}
            underline="never"
            size="md"
            fw={isActive(item.to) ? 600 : 400}
            c={isActive(item.to) ? 'var(--mantine-color-text)' : 'dimmed'}
            px="sm"
            py="xs"
            style={{ borderRadius: 'var(--mantine-radius-sm)', textAlign: 'left' }}
          >
            <Group gap="sm">
              <item.icon size={18} />
              {item.label}
            </Group>
          </Anchor>
        ))}
      </Stack>
    </Drawer>
  );
}

export default MobileDrawer;
