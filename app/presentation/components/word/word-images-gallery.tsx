import { useEffect, useState } from 'react';
import { Group, Modal, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { WordImage } from '@/domain/entities/word.entity';
import {
  RevealViolenceConfirmFooter,
  WordImageView,
} from './word-image-view';

/**
 * Galeri foto kata. Satu konfirmasi "Lihat" membuka semua foto kekerasan
 * di halaman ini; reset saat ganti wordId.
 */
export function WordImagesGallery({
  wordId,
  images,
  lemma,
}: {
  wordId: string;
  images: WordImage[];
  lemma: string;
}) {
  const { t } = useTranslation();
  const [violenceRevealed, setViolenceRevealed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setViolenceRevealed(false);
    setConfirmOpen(false);
  }, [wordId]);

  if (images.length === 0) return null;

  const requestReveal = () => setConfirmOpen(true);

  return (
    <>
      <Stack gap="sm">
        <Group gap="xs">
          <ImageIcon size={16} />
          <Title order={2} size="h5" c="dimmed" tt="uppercase" fw={700}>
            {t('word_imagesHeading', { count: images.length })}
          </Title>
        </Group>
        <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
          {images.map((img) => (
            <WordImageView
              key={img.id}
              image={img}
              revealed={violenceRevealed}
              onRequestReveal={requestReveal}
              alt={img.alt_text?.trim() || t('word_imageAlt', { lemma })}
            />
          ))}
        </SimpleGrid>
      </Stack>

      <Modal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('word_imageViolenceConfirmTitle')}
        centered
      >
        <Stack gap="md">
          <Text size="sm">{t('word_imageViolenceConfirmBody')}</Text>
          <RevealViolenceConfirmFooter
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => {
              setViolenceRevealed(true);
              setConfirmOpen(false);
            }}
          />
        </Stack>
      </Modal>
    </>
  );
}
