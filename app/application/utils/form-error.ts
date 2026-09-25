import { AppError, RateLimitError } from '@/infrastructure/api/api-client';

/**
 * Pesan error untuk form publik (pentest B-06): RateLimitError membawa
 * Retry-After dari API dan ditampilkan eksplisit; AppError dipakai apa adanya
 * (pesan user-facing milik kita); selain itu generik agar detail internal
 * tidak bocor.
 */
export function formError(err: unknown, fallback: string): string {
  if (err instanceof RateLimitError) {
    return `Terlalu banyak permintaan. Coba lagi dalam ${err.retryAfterSeconds} detik.`;
  }
  return err instanceof AppError ? err.message : fallback;
}
