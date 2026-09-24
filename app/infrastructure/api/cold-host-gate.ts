/**
 * Maksimum request bersamaan ke host cold-start (tier terakhir).
 *
 * 2 = satu request UI + satu ulang/warm-up. Request berikutnya mengantri,
 * bukan dibatalkan, supaya halaman tetap selesai tanpa membuka banyak
 * koneksi panjang ke Render yang sedang bangun.
 */
export const COLD_HOST_MAX_IN_FLIGHT = 2;

export interface AbortLike {
  readonly aborted: boolean;
  addEventListener(type: 'abort', listener: () => void, options?: { once?: boolean }): void;
  removeEventListener(type: 'abort', listener: () => void): void;
}

interface Waiter {
  grant: () => void;
  reject: (error: DOMException) => void;
  signal?: AbortLike;
  onAbort: () => void;
}

/** Semaphore async. Slot yang dilepas pindah ke antrian, tidak dihitung dua kali. */
export class ColdHostGate {
  private inFlightCount = 0;
  private readonly waiters: Waiter[] = [];
  readonly maxInFlight: number;

  constructor(maxInFlight = COLD_HOST_MAX_IN_FLIGHT) {
    this.maxInFlight = maxInFlight;
  }

  get inFlight(): number {
    return this.inFlightCount;
  }

  get waiting(): number {
    return this.waiters.length;
  }

  acquire(signal?: AbortLike): Promise<void> {
    if (signal?.aborted) return Promise.reject(abortError());
    if (this.inFlightCount < this.maxInFlight) {
      this.inFlightCount += 1;
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const waiter: Waiter = {
        grant: () => {
          this.detach(waiter);
          resolve();
        },
        reject: (error) => {
          this.detach(waiter);
          reject(error);
        },
        signal,
        onAbort: () => {
          const index = this.waiters.indexOf(waiter);
          if (index >= 0) this.waiters.splice(index, 1);
          this.detach(waiter);
          reject(abortError());
        },
      };
      this.waiters.push(waiter);
      signal?.addEventListener('abort', waiter.onAbort, { once: true });
    });
  }

  release(): void {
    const next = this.waiters.shift();
    if (next) {
      // Slot pindah ke antrian: inFlight tetap.
      next.grant();
      return;
    }
    if (this.inFlightCount > 0) this.inFlightCount -= 1;
  }

  /** Lepas antrian (ganti konfigurasi tes). Pemegang slot yang masih jalan tidak dibangunkan. */
  reset(): void {
    this.inFlightCount = 0;
    const pending = this.waiters.splice(0);
    for (const waiter of pending) waiter.reject(abortError());
  }

  private detach(waiter: Waiter): void {
    waiter.signal?.removeEventListener('abort', waiter.onAbort);
  }
}

function abortError(): DOMException {
  return new DOMException('The operation was aborted.', 'AbortError');
}
