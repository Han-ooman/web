import type { ApiErrorDetail, ApiResponse, CursorMeta } from '@/domain/entities/api.entity';
import { decideFailoverStep, isAbortError, sameHost } from './failover-step';
import {
  acquireColdSlot,
  activeTier,
  advanceTier,
  apiTiers,
  hasFallbacks,
  isColdTier,
  isInfraStatus,
  isReplayableMethod,
  releaseColdSlot,
} from './failover';

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details?: Array<{ field?: string; message: string }>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Data tidak ditemukan') {
    super('NOT_FOUND', message, 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(
    public readonly retryAfterSeconds: number,
    message = 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.',
  ) {
    super('RATE_LIMITED', message, 429);
    this.name = 'RateLimitError';
  }
}

export interface RequestOptions extends RequestInit {
  baseUrl?: string;
  timeoutMs?: number;
}

export interface UnwrappedResult<T> {
  data: T;
  meta?: CursorMeta;
}

type ErrorPayload = { error_code?: string; message?: string; details?: ApiErrorDetail[] };

/** Menandai kegagalan yang layak dicoba di tier berikutnya. */
class InfraFailure extends Error {
  constructor(public readonly fallback: AppError) {
    super(fallback.message);
  }
}

/**
 * Satu percobaan ke SATU tier. Melempar [InfraFailure] kalau tier itu gagal
 * sebagai infrastruktur, dan AppError biasa untuk error aplikasi (yang akan
 * sama saja di tier lain, jadi tidak perlu diulang).
 */
function bindSignals(timeoutMs: number, external: AbortSignal | null | undefined): {
  signal: AbortSignal;
  cleanup: () => void;
  timedOut: () => boolean;
} {
  const controller = new AbortController();
  let didTimeout = false;
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);
  const onExternal = () => controller.abort();
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener('abort', onExternal);
  }
  return {
    signal: controller.signal,
    timedOut: () => didTimeout,
    cleanup: () => {
      clearTimeout(timeoutId);
      external?.removeEventListener('abort', onExternal);
    },
  };
}

async function attempt<T>(
  url: string,
  timeoutMs: number,
  init: RequestInit,
  externalSignal: AbortSignal | null | undefined,
): Promise<UnwrappedResult<T>> {
  const bound = bindSignals(timeoutMs, externalSignal);

  try {
    const res = await fetch(url, { ...init, signal: bound.signal });

    if (res.status === 429) {
      // Rate limit aplikasi: TIDAK dipindahkan. Pindah host justru akan
      // menembus limit lewat ember kedua.
      const retryAfter = Number(res.headers.get('Retry-After')) || 60;
      throw new RateLimitError(retryAfter);
    }

    // Baca sebagai teks dulu. res.json() langsung akan melempar SyntaxError
    // untuk halaman error HTML Cloudflare, dan itu tidak bisa dibedakan dari
    // gangguan jaringan - padahal justru itu sinyal infrastruktur yang dicari.
    const raw = await res.text();
    let payload: (ApiResponse<T> & ErrorPayload) | null = null;
    try {
      payload = JSON.parse(raw) as ApiResponse<T> & ErrorPayload;
    } catch {
      payload = null;
    }

    if (payload === null) {
      const failure = new AppError(
        'UPSTREAM_UNAVAILABLE',
        'Server sedang tidak dapat dihubungi',
        res.status || 502,
      );
      if (isInfraStatus(res.status, null)) throw new InfraFailure(failure);
      throw failure;
    }

    if (!payload.success) {
      const nested = 'error' in payload ? payload.error : undefined;
      const code = nested?.code ?? payload.error_code ?? 'UNKNOWN_ERROR';
      const message = nested?.message ?? payload.message ?? 'Terjadi kesalahan sistem';
      const details = nested?.details ?? payload.details;
      const appError =
        res.status === 404 ? new NotFoundError(message) : new AppError(code, message, res.status, details);
      if (isInfraStatus(res.status, payload)) throw new InfraFailure(appError);
      throw appError;
    }

    return { data: payload.data, meta: payload.meta };
  } catch (error) {
    if (error instanceof InfraFailure || error instanceof RateLimitError) throw error;
    if (error instanceof AppError) throw error;
    // Batal pemanggil (navigasi pergi) bukan kegagalan infrastruktur.
    // Timeout kita sendiri yang layak memindahkan tier.
    if (isAbortError(error) && !bound.timedOut()) throw error;
    if (isAbortError(error)) {
      throw new InfraFailure(new AppError('REQUEST_TIMEOUT', 'Permintaan timeout ke server', 408));
    }
    throw new InfraFailure(
      new AppError('NETWORK_ERROR', (error as Error).message ?? 'Gagal menghubungi server', 500),
    );
  } finally {
    bound.cleanup();
  }
}

function resolveUrl(path: string, baseUrl: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<UnwrappedResult<T>> {
  const { baseUrl, timeoutMs, headers, signal, ...restOptions } = options;
  const init: RequestInit = {
    ...restOptions,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...headers },
  };

  // baseUrl eksplisit = pemanggil memaksa satu host; hormati dan jangan failover.
  const pinnedBase = baseUrl !== undefined;
  const replayable = isReplayableMethod(restOptions.method);
  let lastFailure: AppError | null = null;
  let replayed = false;

  for (;;) {
    const tier = pinnedBase ? { index: 0, baseUrl: baseUrl!, timeoutMs: timeoutMs ?? 10_000 } : activeTier();
    let gated = false;
    let attemptedBaseUrl = tier.baseUrl;
    try {
      if (!pinnedBase && isColdTier(tier)) {
        await acquireColdSlot(signal ?? undefined);
        gated = true;
      }
      // Pin bisa habis selagi mengantri. Pakai host yang sekarang aktif.
      const current = pinnedBase ? tier : activeTier();
      if (gated && !isColdTier(current)) {
        releaseColdSlot();
        gated = false;
      }
      attemptedBaseUrl = current.baseUrl;
      return await attempt<T>(resolveUrl(path, current.baseUrl), timeoutMs ?? current.timeoutMs, init, signal);
    } catch (error) {
      if (isAbortError(error)) throw error;
      if (!(error instanceof InfraFailure)) throw error;
      lastFailure = error.fallback;
      if (pinnedBase || !hasFallbacks()) break;

      const active = activeTier();
      const step = decideFailoverStep({
        replayable,
        replayed,
        failedOnActiveHost: sameHost(attemptedBaseUrl, active.baseUrl),
        hasNextTier: active.index + 1 < apiTiers.length,
      });
      if (step.advance) advanceTier();
      if (!step.retry) break;
      replayed = true;
    } finally {
      if (gated) releaseColdSlot();
    }
  }

  throw lastFailure ?? new AppError('NETWORK_ERROR', 'Gagal menghubungi server', 500);
}
