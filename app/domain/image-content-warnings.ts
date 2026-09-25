/** Peringatan visual per foto (sinkron API content_warnings). */
export const IMAGE_CONTENT_WARNING_KEKERASAN = 'kekerasan' as const;

export type ImageContentWarning = typeof IMAGE_CONTENT_WARNING_KEKERASAN;

export function hasViolenceWarning(
  warnings: readonly string[] | null | undefined,
): boolean {
  return (warnings ?? []).includes(IMAGE_CONTENT_WARNING_KEKERASAN);
}

/** URL gambar aman untuk OG / JSON-LD (lewati foto ber-flag kekerasan). */
export function pickSafePrimaryImageUrl(
  images: ReadonlyArray<{
    url: string;
    is_primary: boolean;
    content_warnings?: string[] | null;
  }>,
): string | undefined {
  const safe = images.filter((img) => !hasViolenceWarning(img.content_warnings));
  return safe.find((img) => img.is_primary)?.url ?? safe[0]?.url ?? undefined;
}
