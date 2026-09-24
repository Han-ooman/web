export interface FailoverStepInput {
  /** GET/HEAD boleh diulang. Mutasi tidak. */
  replayable: boolean;
  /** Request ini sudah pernah diulang sekali. */
  replayed: boolean;
  /** Kegagalan terjadi di host yang sedang menjadi pin aktif. */
  failedOnActiveHost: boolean;
  /** Masih ada tier di atas pin aktif. */
  hasNextTier: boolean;
}

export interface FailoverStep {
  /** Geser pin satu tingkat. */
  advance: boolean;
  /** Ulangi request ini sekali ke pin yang sekarang aktif. */
  retry: boolean;
}

/**
 * Satu langkah breaker untuk SATU request yang gagal.
 *
 * Request yang gagal di host lama tidak menggeser pin: pin sudah dipindah
 * request lain, dan menggesernya lagi akan meloncat 1 → 3 dalam satu gelombang.
 * Percobaan kedua tidak diulang lagi (timeout mutasi bisa berarti data sudah tersimpan;
 * untuk GET, percobaan ulang pengguna yang berikutnya mendarat di tier baru).
 */
export function decideFailoverStep(input: FailoverStepInput): FailoverStep {
  const { replayable, replayed, failedOnActiveHost, hasNextTier } = input;

  if (!replayable || replayed) {
    return { advance: failedOnActiveHost && hasNextTier, retry: false };
  }

  if (!failedOnActiveHost) {
    return { advance: false, retry: true };
  }

  if (!hasNextTier) return { advance: false, retry: false };
  return { advance: true, retry: true };
}

export function sameHost(a: string | undefined, b: string | undefined): boolean {
  const norm = (value: string | undefined) => (value ?? '').replace(/\/+$/, '');
  return norm(a) === norm(b);
}

export function isAbortError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { name?: string; code?: string; cause?: unknown };
  if (candidate.name === 'AbortError' || candidate.name === 'CanceledError' || candidate.code === 'ERR_CANCELED') {
    return true;
  }
  return candidate.cause !== undefined && candidate.cause !== error && isAbortError(candidate.cause);
}
