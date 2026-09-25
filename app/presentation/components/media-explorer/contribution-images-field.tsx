import { useState } from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { ImagePlus, Star, Trash2 } from 'lucide-react';
import {
  STOCK_PROVIDER_LABELS,
  type ShareBackgroundItem,
  type StockPhotoProvider,
} from '@/infrastructure/api/share-backgrounds-api';
import { MediaExplorerModal } from './media-explorer-modal';
import {
  displayImageUrl,
  isAllowedDisplayImageUrl,
} from '@/presentation/utils/display-image-url';

export const MAX_CONTRIBUTION_IMAGES = 3;

export interface ContributionImageSlot {
  id: string;
  url: string;
  provider: StockPhotoProvider;
  provider_file_id: string;
  alt_text: string;
  is_primary: boolean;
}

export interface ContributionImagesFieldProps {
  images: ContributionImageSlot[];
  onChange: (next: ContributionImageSlot[]) => void;
}

/**
 * Slot gambar stock untuk form kontribusi tamu (max 3).
 * Hanya Media Explorer - tanpa upload lokal.
 */
export function ContributionImagesField({
  images,
  onChange,
}: ContributionImagesFieldProps) {
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);
  const atLimit = images.length >= MAX_CONTRIBUTION_IMAGES;

  const addStock = (item: ShareBackgroundItem) => {
    if (images.length >= MAX_CONTRIBUTION_IMAGES) return;
    if (images.some((img) => img.provider_file_id === item.id)) return;
    // API meneruskan `url`/`preview_url` provider apa adanya, jadi hostnya
    // bisa apa saja. Tolak yang bukan https + host allowlist sebelum URL masuk
    // state form (pentest BH-03). Validasi API tetap yang utama; ini hanya
    // supaya contributor tidak mengirim payload yang pasti ditolak.
    if (!isAllowedDisplayImageUrl(item.url)) {
      setRejected(
        `Foto dari ${STOCK_PROVIDER_LABELS[item.provider] ?? item.provider} ditolak: host gambar tidak dikenal.`,
      );
      return;
    }
    setRejected(null);
    const photographer =
      item.photographer.trim() ||
      STOCK_PROVIDER_LABELS[item.provider] ||
      item.provider;
    const slot: ContributionImageSlot = {
      id: `stock-${item.provider}-${item.id}-${images.length}`,
      url: item.url,
      provider: item.provider,
      provider_file_id: item.id,
      alt_text: `Foto: ${photographer} / ${item.provider}`,
      is_primary: images.length === 0,
    };
    onChange([...images, slot]);
  };

  const remove = (id: string) => {
    const next = images.filter((img) => img.id !== id);
    if (next.length > 0 && !next.some((img) => img.is_primary)) {
      next[0] = { ...next[0], is_primary: true };
    }
    onChange(next);
  };

  const setPrimary = (id: string) => {
    onChange(
      images.map((img) => ({
        ...img,
        is_primary: img.id === id,
      })),
    );
  };

  const patchAlt = (id: string, alt_text: string) => {
    onChange(images.map((img) => (img.id === id ? { ...img, alt_text } : img)));
  };

  return (
    <Stack gap="sm">
      <Stack gap={4}>
        <Text size="sm" fw={500}>
          Gambar ilustrasi
        </Text>
        <Text size="xs" c="dimmed">
          Opsional. Pilih foto stock lewat Media Explorer (tanpa login). Maks{' '}
          {MAX_CONTRIBUTION_IMAGES}.
        </Text>
      </Stack>

      {images.length > 0 ? (
        <Stack gap="sm">
          {images.map((img) => (
            <Group
              key={img.id}
              align="flex-start"
              wrap="nowrap"
              gap="sm"
              p="xs"
              style={{
                border: '1px solid var(--mantine-color-default-border)',
                borderRadius: 'var(--mantine-radius-md)',
              }}
            >
              <Box
                style={{
                  width: 72,
                  height: 72,
                  flexShrink: 0,
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: 'var(--mantine-color-gray-1)',
                }}
              >
                <img
                  src={displayImageUrl(img.url, { width: 144, height: 144 })}
                  alt={img.alt_text}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </Box>
              <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
                <Group gap={6}>
                  <Badge size="sm" variant="light">
                    {STOCK_PROVIDER_LABELS[img.provider]}
                  </Badge>
                  {img.is_primary ? (
                    <Badge size="sm" color="yellow" variant="light">
                      Utama
                    </Badge>
                  ) : null}
                </Group>
                <TextInput
                  size="xs"
                  placeholder="Teks alternatif"
                  value={img.alt_text}
                  onChange={(e) => patchAlt(img.id, e.currentTarget.value)}
                />
                <Group gap={4}>
                  {!img.is_primary ? (
                    <Button
                      type="button"
                      size="compact-xs"
                      variant="subtle"
                      leftSection={<Star size={12} />}
                      onClick={() => setPrimary(img.id)}
                    >
                      Jadikan utama
                    </Button>
                  ) : null}
                  <ActionIcon
                    type="button"
                    variant="subtle"
                    color="red"
                    aria-label="Hapus gambar"
                    onClick={() => remove(img.id)}
                  >
                    <Trash2 size={14} />
                  </ActionIcon>
                </Group>
              </Stack>
            </Group>
          ))}
        </Stack>
      ) : null}

      <Button
        type="button"
        variant="light"
        color="gray"
        leftSection={<ImagePlus size={16} />}
        disabled={atLimit}
        onClick={() => setExplorerOpen(true)}
      >
        {atLimit
          ? `Maksimal ${MAX_CONTRIBUTION_IMAGES} foto`
          : 'Pilih dari Media Explorer'}
      </Button>

      {rejected ? (
        <Text size="xs" c="red">
          {rejected}
        </Text>
      ) : null}

      <MediaExplorerModal
        open={explorerOpen}
        onClose={() => setExplorerOpen(false)}
        onSelect={addStock}
      />
    </Stack>
  );
}
