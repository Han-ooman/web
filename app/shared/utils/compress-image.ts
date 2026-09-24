/** Batas kompresi foto sebelum upload (selaras mobile photo_pick_constants). */
export const PHOTO_UPLOAD_MAX_WIDTH = 720;
export const PHOTO_UPLOAD_MAX_HEIGHT = 720;
export const PHOTO_UPLOAD_QUALITY = 0.8;

/**
 * Resize (tidak ada sisi > 720) + JPEG quality 80.
 * Dipakai jika web menambah unggah gambar; file non-image → apa adanya.
 */
export async function compressImageForUpload(
  file: File,
  opts: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {},
): Promise<File> {
  const maxWidth = opts.maxWidth ?? PHOTO_UPLOAD_MAX_WIDTH;
  const maxHeight = opts.maxHeight ?? PHOTO_UPLOAD_MAX_HEIGHT;
  const quality = opts.quality ?? PHOTO_UPLOAD_QUALITY;

  if (!file.type.startsWith('image/')) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  try {
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    if (scale >= 1 && file.type === 'image/jpeg' && file.size < 200_000) {
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    );
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}
