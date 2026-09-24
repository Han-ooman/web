import { env } from '../config/env';
import { ColdHostGate, type AbortLike } from './cold-host-gate';

/**
 * Circuit breaker tiga tier untuk web.
 *
 * Reaktif: tetap di tier 1 sampai ada kegagalan infrastruktur nyata, lalu naik
 * SATU tier dan pin selama 5 menit sebelum tier 1 dicoba lagi.
 *
 * CATATAN isolate: di Cloudflare Workers state modul hidup per-isolate dan
 * per-colo, jadi ini cache usaha-terbaik, bukan state global. Paling buruk tiap
 * isolate menemukan kegagalan itu sekali - tetap jauh lebih murah daripada
 * membiarkan semua request gagal.
 */

const PIN_MS = 5 * 60 * 1000;

/** Timeout normal - sama dengan nilai apiClient sebelum failover ada. */
const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Probe `/health` hanya untuk memulai boot. Tidak perlu menunggu instance siap
 * (itu tugas request data), dan koneksi yang menggantung harus bisa dibatalkan.
 */
const HEALTH_PROBE_MS = 8_000;

/**
 * Timeout tier terakhir. Render paket gratis tidur setelah ~15 menit dan bangun
 * sampai ~60 detik.
 *
 * Di browser boleh menunggu penuh (ada spinner). Di SSR TIDAK: 75 detik di dalam
 * loader berarti halaman kosong dan Worker membakar wall-clock, jadi dibatasi
 * 20 detik lalu biarkan degradasi anggun yang sudah ada (search/words
 * mengembalikan hasil kosong saat error) mengambil alih.
 */
const COLD_START_TIMEOUT_MS = typeof window === 'undefined' ? 20_000 : 75_000;

const isServer = () => typeof window === 'undefined';

export interface ApiTier {
  readonly index: number;
  readonly baseUrl: string;
  readonly timeoutMs: number;
}

function buildTiers(): readonly ApiTier[] {
  const urls = [env.apiBaseUrl, ...env.apiBaseUrlFallbacks];
  return urls.map((baseUrl, index) => ({
    index,
    baseUrl,
    timeoutMs:
      index === urls.length - 1 && urls.length > 1 ? COLD_START_TIMEOUT_MS : DEFAULT_TIMEOUT_MS,
  }));
}

const tiers = buildTiers();
const coldGate = new ColdHostGate();

let pinnedIndex = 0;
let pinnedUntil = 0;
let warmedUpForPin = 0;
let probeAbort: AbortController | null = null;
let probeTimer: ReturnType<typeof setTimeout> | null = null;

/** false = tidak ada tujuan pindah; apiClient jalan seperti sebelumnya. */
export function hasFallbacks(): boolean {
  return tiers.length > 1;
}

/** Tier terakhir menanggung cold start (timeout lebih panjang dari tier biasa). */
export function isColdTier(tier: ApiTier): boolean {
  return tier.timeoutMs > DEFAULT_TIMEOUT_MS;
}

export function acquireColdSlot(signal?: AbortLike): Promise<void> {
  return coldGate.acquire(signal);
}

export function releaseColdSlot(): void {
  coldGate.release();
}

/** Murni - tidak memutasi apa pun. Pin kedaluwarsa cukup berhenti dihitung. */
function effectiveIndex(): number {
  if (pinnedUntil === 0 || Date.now() >= pinnedUntil) return 0;
  return pinnedIndex;
}

export function activeTier(): ApiTier {
  return tiers[effectiveIndex()];
}

/** Naik satu tier dan pin. Tier terakhir terminal - tidak ada host keempat. */
export function advanceTier(): ApiTier | null {
  const next = effectiveIndex() + 1;
  if (next >= tiers.length) return null;
  pinnedIndex = next;
  pinnedUntil = Date.now() + PIN_MS;
  warmUpTierAfter(next);
  return tiers[next];
}

/**
 * Bangunkan tier SETELAH yang baru di-pin, sekali per jendela pin.
 *
 * Kenapa bukan cron 24/7: menjaga Render melek terus memakan ~730 dari 750 jam
 * gratis per bulan, jadi kuota bisa habis tepat saat cadangan diperlukan.
 */
function cancelProbe(): void {
  if (probeTimer !== null) clearTimeout(probeTimer);
  probeTimer = null;
  probeAbort?.abort();
  probeAbort = null;
}

function warmUpTierAfter(pinnedAt: number): void {
  const warm = tiers[pinnedAt + 1];
  if (!warm) return;
  if (warmedUpForPin === pinnedUntil) return;

  let origin: string;
  try {
    const base = typeof window === 'undefined' ? 'https://placeholder.invalid' : window.location.origin;
    origin = new URL(warm.baseUrl, base).origin;
  } catch {
    return;
  }
  warmedUpForPin = pinnedUntil;

  cancelProbe();
  const controller = new AbortController();
  probeAbort = controller;
  probeTimer = setTimeout(() => controller.abort(), HEALTH_PROBE_MS);
  // Di browser `/health` tidak ikut CORS `/api/*`. `no-cors` tetap mengirim GET
  // supaya Render bangun; body-nya tidak perlu dibaca.
  const init: RequestInit = { method: 'GET', signal: controller.signal };
  if (typeof window !== 'undefined') init.mode = 'no-cors';
  void fetch(`${origin}/health`, init)
    .catch(() => {})
    .finally(() => {
      if (probeAbort !== controller) return;
      if (probeTimer !== null) clearTimeout(probeTimer);
      probeTimer = null;
      probeAbort = null;
    });
}

/** Hanya metode idempoten boleh diulang otomatis ke tier lain. */
export function isReplayableMethod(method: string | undefined): boolean {
  const m = (method ?? 'GET').toUpperCase();
  return m === 'GET' || m === 'HEAD';
}

/**
 * Apakah status + body ini kegagalan INFRASTRUKTUR (server belum menjawab
 * sebagai aplikasi), bukan error aplikasi?
 *
 * `parsed === null` berarti body bukan JSON - itu halaman error HTML Cloudflare
 * (1015, 1027, 1101, 1102), jadi request tidak pernah mencapai aplikasi kita.
 */
export function isInfraStatus(status: number, parsed: { error_code?: string } | null): boolean {
  if (status === 502 || status === 504) return true;
  if (status === 503) {
    // 503 aplikasi (provider mati) akan sama di tier lain; hanya kapasitas yang
    // layak dipindahkan.
    return parsed === null || parsed.error_code === 'UPSTREAM_CAPACITY';
  }
  if (status >= 500 && parsed === null) return true;
  return false;
}

/** Diekspor untuk test dan untuk log dev. */
export function __resetFailoverForTests(): void {
  pinnedIndex = 0;
  pinnedUntil = 0;
  warmedUpForPin = 0;
  cancelProbe();
  coldGate.reset();
}

export { isServer, tiers as apiTiers };
