import { Link } from 'react-router';
import { Anchor, Container, Divider, Group, Image, Stack, Text } from '@mantine/core';
import { Heart, ExternalLink } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Container size="md" py="md">
      <Group justify="space-between" gap="md">
        <Group gap="xs" justify="center">
          <Image src="/logo.png" alt="" h={20} w={20} fit="contain" />
          <Text size="sm" c="dimmed">
            <Text span fw={600} c="var(--mantine-color-text)">
              SambasKu
            </Text>{' '}
            — Kamus Digital Kolaboratif Bahasa Sambas &amp; Indonesia
          </Text>
        </Group>

        <Group gap="lg" justify="center">
          <Anchor component={Link} to="/words" size="xs" c="dimmed">
            Daftar A-Z
          </Anchor>
          <Anchor component={Link} to="/search" size="xs" c="dimmed">
            Pencarian
          </Anchor>
          <Anchor
            href="https://github.com/iamutaki/sambasku"
            target="_blank"
            rel="noreferrer"
            size="xs"
            c="dimmed"
          >
            <Group gap={4} wrap="nowrap">
              <ExternalLink size={13} />
              GitHub
            </Group>
          </Anchor>
        </Group>
      </Group>

      <Divider my="sm" />

      <Stack gap={4} align="center">
        <Text size="xs" c="dimmed" ta="center">
          © {currentYear} SambasKu. Didukung oleh penutur asli dan pegiat bahasa.
        </Text>
        <Group gap={4} wrap="nowrap">
          <Text size="xs" c="dimmed">
            Dibuat dengan
          </Text>
          <Heart size={12} color="var(--mantine-color-red-5)" fill="var(--mantine-color-red-5)" />
          <Text size="xs" c="dimmed">
            untuk pelestarian bahasa daerah.
          </Text>
        </Group>
      </Stack>
    </Container>
  );
}
