import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { reactRouter } from '@react-router/dev/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { apiConnectOriginsFrom, buildSecurityHeaders } from './app/edge/security-headers';

/**
 * Tulis ulang `public/_headers` dari modul header yang sama dengan yang dipakai
 * `app/worker.ts` (pentest BH-06).
 *
 * Sebelumnya `public/_headers` punya daftar `connect-src` hardcoded
 * yang bisa drift dari `VITE_API_BASE_URL`; sekarang keduanya memanggil
 * `buildSecurityHeaders()`, jadi mustahil berbeda.
 *
 * Header SSR dan header aset statis memang dipasang di dua tempat
 * (Workers hanya memakai `_headers` untuk aset, sedangkan HTML lewat worker),
 * tapi nilainya sekarang berasal dari satu fungsi.
 */

const PREAMBLE = [
  '# DIHASILKAN OTOMATIS oleh plugin sambasku:generate-headers-file di vite.config.ts.',
  '# JANGAN diedit manual - edit app/edge/security-headers.ts lalu build ulang.',
  '# Nilai identik dengan yang dikirim app/worker.ts ke respons SSR.',
  '',
  '/*',
].join('\n');

const STATIC_RULES = [
  '',
  '# Asset build Vite content-hashed (root-*.css dkk): nama berubah setiap',
  '# rebuild, aman di-cache permanen. Tanpa ini default Workers Assets',
  '# = max-age=0, must-revalidate (revalidate semua tiap kunjungan).',
  '/assets/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '',
  '/fonts/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '',
  '# App Links / Universal Links verification (no redirect, correct MIME).',
  '/.well-known/apple-app-site-association',
  '  Content-Type: application/json',
  '  Cache-Control: public, max-age=3600',
  '',
  '/.well-known/assetlinks.json',
  '  Content-Type: application/json',
  '  Cache-Control: public, max-age=3600',
  '',
].join('\n');

function generateHeadersFile(): Plugin {
  let root = process.cwd();
  let mode = 'production';
  let command = 'serve';
  return {
    name: 'sambasku:generate-headers-file',
    configResolved(config) {
      root = config.root ? String(config.root) : process.cwd();
      mode = config.mode || 'production';
      command = config.command || 'serve';
    },
    buildStart() {
      // Hanya saat build sungguhan. `react-router typegen` (dipanggil
      // `pnpm typecheck`) dan `pnpm dev` juga memuat plugin ini; kalau tidak
      // dikunci di sini, keduanya menulis ulang `public/_headers` dengan env
      // yang salah dan connector tier produksi ikut hilang dari file.
      if (command !== 'build') return;

      const envVars = loadEnv(mode, root, 'VITE_');

      const headers = buildSecurityHeaders({
        apiConnectOrigins: apiConnectOriginsFrom([
          envVars.VITE_API_BASE_URL ?? '',
          ...(envVars.VITE_API_BASE_URL_FALLBACKS ?? '').split(','),
        ]),
        isProd: mode === 'production',
      });

      const body = [
        PREAMBLE,
        ...Object.entries(headers).map(([key, value]) => `  ${key}: ${value}`),
        STATIC_RULES,
      ].join('\n');

      const target = `${root.replace(/\/+$/, '')}/public/_headers`;
      // Tulis hanya kalau berubah, supaya build tidak mengotori working tree.
      let current: string | null = null;
      try {
        current = readFileSync(target, 'utf8');
      } catch {
        current = null;
      }
      if (current !== body) writeFileSync(target, body, 'utf8');
    },
  };
}

export default defineConfig({
  plugins: [
    generateHeadersFile(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    reactRouter(),
  ],
  // Pre-declare agar dep optimizer mem-bundle semuanya dalam SATU pass.
  // Tanpa ini @mantine/core (ditemukan belakangan) memicu pass kedua dan
  // menghasilkan dua copy React di browser (Invalid hook call).
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router',
      'react-router-dom',
      '@mantine/core',
      '@mantine/hooks',
      'lucide-react',
      'i18next',
      'react-i18next',
    ],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./app', import.meta.url)),
    },
    // Cegah dua copy React saat dep optimizer mem-bundle @mantine/core
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET ?? 'https://sambasku-staging.iamutaki.com',
        changeOrigin: true,
      },
    },
  },
});
