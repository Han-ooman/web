import { Badge, Group, Text } from '@mantine/core';
import type { WordAudio } from '@/domain/entities/word.entity';

/** Pemutar satu take `word_audios` — URL file, bukan teks notasi IPA. */
export function WordAudioPlayer({ audio }: { audio: WordAudio }) {
  const speaker = audio.speaker_name?.trim();
  return (
    <Group gap={8} wrap="nowrap" align="center">
      <audio
        controls
        preload="none"
        src={audio.url}
        style={{ height: 32, maxWidth: '100%', minWidth: 180 }}
      >
        <a href={audio.url}>Unduh audio</a>
      </audio>
      {speaker ? (
        <Text size="xs" c="dimmed">
          {speaker}
        </Text>
      ) : null}
      {audio.is_primary ? (
        <Badge size="xs" variant="light">
          Utama
        </Badge>
      ) : null}
    </Group>
  );
}
