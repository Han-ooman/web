import type { ApiErrorDetail, ApiResponse, CursorMeta } from '@/domain/entities/api.entity';
import { activeTier, advanceTier, hasFallbacks, isInfraStatus, isReplayableMethod, tiersToTry } from './failover';

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
async function attempt<T>(
  url: string,
  timeoutMs: number,
  init: RequestInit,
  externalSignal: AbortSignal | null | undefined,
): Promise<UnwrappedResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...init, signal: externalSignal ?? controller.signal });

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
    // Timeout dan kegagalan socket: aplikasi belum menjawab sama sekali.
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new InfraFailure(new AppError('REQUEST_TIMEOUT', 'Permintaan timeout ke server', 408));
    }
    throw new InfraFailure(
      new AppError('NETWORK_ERROR', (error as Error).message ?? 'Gagal menghubungi server', 500),
    );
  } finally {
    clearTimeout(timeoutId);
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
  const { baseUrl, timeoutMs, headers, ...restOptions } = options;
  const init: RequestInit = {
    ...restOptions,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...headers },
  };

  // baseUrl eksplisit = pemanggil memaksa satu host; hormati dan jangan failover.
  const pinnedBase = baseUrl !== undefined;
  const canFailover = !pinnedBase && hasFallbacks && isReplayableMethod(restOptions.method);
  const candidates = pinnedBase
    ? [{ index: 0, baseUrl: baseUrl!, timeoutMs: timeoutMs ?? 10_000 }]
    : canFailover
      ? tiersToTry()
      : [activeTier()];

  let lastFailure: AppError | null = null;

  for (const tier of candidates) {
    try {
      return await attempt<T>(
        resolveUrl(path, tier.baseUrl),
        timeoutMs ?? tier.timeoutMs,
        init,
        options.signal,
      );
    } catch (error) {
      if (!(error instanceof InfraFailure)) throw error;
      lastFailure = error.fallback;
      // Tandai tier ini jatuh walau request tidak boleh diulang - permintaan
      // berikutnya (termasuk mutasi yang diulang pengguna) langsung ke tier baru.
      if (!pinnedBase) advanceTier();
      if (!canFailover) break;
    }
  }

  throw lastFailure ?? new AppError('NETWORK_ERROR', 'Gagal menghubungi server', 500);
}
