import {
  Box,
  Button,
  Center,
  Group,
  Image,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { Clock, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { hasViolenceWarning } from '@/domain/image-content-warnings';
import type { WordImage } from '@/domain/entities/word.entity';
import { displayImageUrl } from '@/presentation/utils/display-image-url';

const PENDING_PLACEHOLDER_HOSTS = new Set(['placehold.co', 'via.placeholder.com']);

function isKnownPendingPlaceholderUrl(url: string): boolean {
  try {
    return PENDING_PLACEHOLDER_HOSTS.has(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

function isPendingImage(image: WordImage): boolean {
  return image.is_verified === false || isKnownPendingPlaceholderUrl(image.url);
}

/**
 * Thumbnail foto kata: pending → placeholder; kekerasan belum reveal → blur + CTA.
 * State reveal dikelola parent (satu unlock untuk semua foto di halaman).
 */
export function WordImageView({
  image,
  revealed,
  onRequestReveal,
  alt,
}: {
  image: WordImage;
  revealed: boolean;
  onRequestReveal?: () => void;
  alt: string;
}) {
  const { t } = useTranslation();
  // Tanpa fallback ke URL mentah: displayImageUrl menolak skema non-https
  // (pentest W-10) dan fallback akan membatalkan validasi itu.
  const src = displayImageUrl(image.url, { width: 800 });

  if (isPendingImage(image)) {
    return (
      <Center
        h={200}
        bg="var(--mantine-color-gray-1)"
        style={{ borderRadius: 'var(--mantine-radius-md)' }}
        aria-label={t('word_imagePendingAria')}
      >
        <Stack gap={6} align="center">
          <Clock size={20} opacity={0.55} />
          <Text size="xs" c="dimmed" ta="center">
            {t('word_imagePending')}
          </Text>
        </Stack>
      </Center>
    );
  }

  if (hasViolenceWarning(image.content_warnings) && !revealed) {
    return (
      <UnstyledButton
        onClick={onRequestReveal}
        aria-label={t('word_imageViolenceAria')}
        style={{
          display: 'block',
          width: '100%',
          borderRadius: 'var(--mantine-radius-md)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Image
          src={src}
          alt=""
          h={200}
          fit="cover"
          style={{ filter: 'blur(24px)', transform: 'scale(1.08)' }}
        />
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12,
          }}
        >
          <Stack gap={6} align="center">
            <EyeOff size={22} color="white" opacity={0.9} />
            <Text size="xs" c="white" fw={600} ta="center">
              {t('word_imageViolenceLabel')}
            </Text>
            <Text size="xs" c="white" td="underline" ta="center">
              {t('word_imageViolenceCta')}
            </Text>
          </Stack>
        </Box>
      </UnstyledButton>
    );
  }

  return (
    <Image src={src} alt={alt} radius="md" h={200} fit="cover" />
  );
}

export function RevealViolenceConfirmFooter({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Group grow>
      <Button variant="default" onClick={onCancel}>
        {t('word_imageViolenceCancel')}
      </Button>
      <Button onClick={onConfirm}>{t('word_imageViolenceConfirm')}</Button>
    </Group>
  );
}
