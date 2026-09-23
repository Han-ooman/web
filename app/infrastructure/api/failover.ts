import { env } from '../config/env';

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

let pinnedIndex = 0;
let pinnedUntil = 0;
let warmedUpForPin = 0;

/** false = tidak ada tujuan pindah; apiClient jalan seperti sebelumnya. */
export const hasFallbacks = tiers.length > 1;

/** Murni - tidak memutasi apa pun. Pin kedaluwarsa cukup berhenti dihitung. */
function effectiveIndex(): number {
  if (pinnedUntil === 0 || Date.now() >= pinnedUntil) return 0;
  return pinnedIndex;
}

export function activeTier(): ApiTier {
  return tiers[effectiveIndex()];
}

/**
 * Daftar tier yang boleh dicoba untuk SATU request, mulai dari tier aktif.
 * Tier di atasnya tidak dicoba ulang: kalau tier 1 baru saja gagal, mencobanya
 * lagi dalam request yang sama hanya menambah latensi.
 */
export function tiersToTry(): readonly ApiTier[] {
  return tiers.slice(effectiveIndex());
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
function warmUpTierAfter(pinnedAt: number): void {
  const warm = tiers[pinnedAt + 1];
  if (!warm) return;
  if (warmedUpForPin === pinnedUntil) return;
  warmedUpForPin = pinnedUntil;
  const origin = new URL(warm.baseUrl, 'https://placeholder.invalid').origin;
  // Sengaja tanpa await dan tanpa penanganan error: hanya usaha memulai boot.
  void fetch(`${origin}/health`, { method: 'GET' }).catch(() => {});
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
}

export { isServer, tiers as apiTiers };
