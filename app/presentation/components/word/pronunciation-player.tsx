import { useState } from 'react';
import { ActionIcon, Code, Group } from '@mantine/core';
import { Volume2 } from 'lucide-react';
import type { WordPronunciation } from '@/domain/entities/word.entity';

export function PronunciationPlayer({ pronunciation }: { pronunciation: WordPronunciation }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const isAudioUrl =
    pronunciation.value.startsWith('http://') || pronunciation.value.startsWith('https://');

  const playAudio = () => {
    if (!isAudioUrl) return;
    try {
      const audio = new Audio(pronunciation.value);
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      audio.play().catch(() => setIsPlaying(false));
    } catch {
      setIsPlaying(false);
    }
  };

  return (
    <Group gap={6} wrap="nowrap">
      <Code>{pronunciation.notation}</Code>
      {isAudioUrl && (
        <ActionIcon
          variant="subtle"
          size="sm"
          loading={isPlaying}
          onClick={playAudio}
          aria-label={`Putar audio ${pronunciation.notation}`}
        >
          {!isPlaying && <Volume2 size={14} />}
        </ActionIcon>
      )}
    </Group>
  );
}
