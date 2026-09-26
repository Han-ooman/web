/**
 * Header keamanan untuk respons SSR (worker) DAN aset statis (public/_headers).
 *
 * Modul ini adalah SATU-SATUNYA sumber kebenaran CSP. `worker.ts` memakainya
 * untuk respons yang dirender, dan plugin `sambasku:generate-headers-file` di
 * `vite.config.ts` memakainya untuk menulis ulang `public/_headers` saat build.
 * Sebelumnya kedua tempat itu punya daftar sendiri: `public/_headers` menulis
 * `connect-src` host API secara hardcoded sementara worker menurunkannya dari
 * `VITE_API_BASE_URL` - kalau env berubah, satu sisi diam-diam jadi stale
 * (pentest BH-06).
 *
 * `connect-src` diturunkan dari tier API yang sama dengan circuit breaker
 * (env build-time), bukan daftar manual - pentest W-01: CSP produksi pernah
 * drift dan kehilangan host failover, mematikan failover di browser.
 * URL relative (/api/v1) = same-origin, sudah tercakup 'self'.
 *
 * Modul ini SENGAJA tidak meng-import `infrastructure/config/env` supaya
 * tetap pure: ia diuji langsung dengan `node --experimental-strip-types`,
 * sementara `import.meta.env` hanya ada di runtime Vite. `app/worker.ts` yang
 * menyusunnya dengan env build.
 */

export interface SecurityHeaderConfig {
  /** Origin API (https) yang boleh dipanggil browser; 'self' selalu ikut. */
  apiConnectOrigins: readonly string[];
  /** true = build produksi: tanpa 'unsafe-eval' (pentest W-02). */
  isProd: boolean;
}

/** Origin https dari daftar base URL API; URL non-https diabaikan. */
export function apiConnectOriginsFrom(
  baseUrls: readonly string[],
): readonly string[] {
  const origins = baseUrls.flatMap((raw) => {
    try {
      const parsed = new URL(raw);
      return parsed.protocol === 'https:' ? [parsed.origin] : [];
    } catch {
      return [];
    }
  });
  return [...new Set(origins)];
}

/**
 * 'unsafe-eval' hanya untuk dev/staging (kebutuhan HMR); build produksi
 * tidak mengevaluasi kode dinamis (pentest W-02). 'unsafe-inline' masih
 * wajib: React Router menyuntikkan inline script hydration (nonce = backlog).
 */
export function buildCsp({
  apiConnectOrigins,
  isProd,
}: SecurityHeaderConfig): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"} https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    // Allowlist host gambar aktual (pentest W-09): jsDelivr = media repo
    // GitHub, wsrv.nl = proxy resize, ik.imagekit.io = kontribusi user.
    // Foto stock Media Explorer (flickr/pixabay/openverse) juga lewat wsrv.nl,
    // jadi CSP ini TIDAK perlu host baru - dan tidak perlu dilonggarkan
    // (pentest BH-02).
    "img-src 'self' data: blob: https://ik.imagekit.io https://cdn.jsdelivr.net https://wsrv.nl",
    "media-src 'self' blob: https://cdn.jsdelivr.net",
    `connect-src 'self' ${apiConnectOrigins.join(' ')} https://cloudflareinsights.com`,
    "frame-ancestors 'none'",
  ].join('; ');
}

export type SecurityHeaders = Readonly<Record<string, string>>;

export function buildSecurityHeaders(
  config: SecurityHeaderConfig,
): SecurityHeaders {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    // Pentest W-05: isolasi lintas origin (deep link sambasku:// + share).
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Content-Security-Policy': buildCsp(config),
  };
}
