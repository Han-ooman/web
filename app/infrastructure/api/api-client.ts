import { env } from '../config/env';
import type { ApiErrorDetail, ApiResponse, CursorMeta } from '@/domain/entities/api.entity';

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

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<UnwrappedResult<T>> {
  const { baseUrl = env.apiBaseUrl, timeoutMs = 10000, headers, ...restOptions } = options;

  let url = path;
  if (!path.startsWith('http://') && !path.startsWith('https://')) {
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    url = `${cleanBase}${cleanPath}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...restOptions,
      signal: options.signal ?? controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get('Retry-After')) || 60;
      throw new RateLimitError(retryAfter);
    }

    const payload = (await res.json()) as ApiResponse<T> & {
      error_code?: string;
      message?: string;
      details?: ApiErrorDetail[];
    };

    if (!payload.success) {
      const nested = 'error' in payload ? payload.error : undefined;
      const code = nested?.code ?? payload.error_code ?? 'UNKNOWN_ERROR';
      const message = nested?.message ?? payload.message ?? 'Terjadi kesalahan sistem';
      const details = nested?.details ?? payload.details;
      if (res.status === 404) {
        throw new NotFoundError(message);
      }
      throw new AppError(code, message, res.status, details);
    }

    return {
      data: payload.data,
      meta: payload.meta,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AppError('REQUEST_TIMEOUT', 'Permintaan timeout ke server', 408);
    }
    throw new AppError('NETWORK_ERROR', (error as Error).message ?? 'Gagal menghubungi server', 500);
  } finally {
    clearTimeout(timeoutId);
  }
}
