<p align="center">
  <img src="logo.png" alt="SambasKu" width="320" />
</p>

# SambasKu Web

Situs **publik** Kamus Digital Sambas-Indonesia. Pengunjung mencari dan
membaca kata sebagai tamu, tanpa login. Halaman dirender SSR di edge
(HTML + meta + JSON-LD) supaya crawler melihat konten utuh sebelum
hydration.

## Stack

| Layer | Pilihan |
| --- | --- |
| Framework | React 19 + React Router v7 (`ssr: true`) |
| UI | Mantine v9, Lucide icons |
| Bahasa | TypeScript (strict) |
| Build | Vite + `@cloudflare/vite-plugin` |
| Deploy | Cloudflare Workers (bukan Pages) |

Acuan tetap: `docs/web/web-base-stack.md` di repo
[sambasku-docs](https://github.com/iamutaki/sambasku-docs).
Kontrak response mengikuti `docs/api/*`.

## Lingkungan

| Mode | URL | SEO |
| --- | --- | --- |
| development | `http://localhost:5173` | off |
| staging | `https://sambasku-web-staging.iamutaki.com` (DNS Cloudflare) | off (`noindex`) |
| production | `https://sambasku.com` | on |

Nilai `VITE_*` di-inline saat build dari `.env.development` /
`.env.staging` / `.env.production`. Tidak ada secret di bundle.

Dev: Vite mem-proxy `/api` ke API staging (same-origin, bebas CORS).

## Aset media

| Jenis | Sumber |
| --- | --- |
| Gambar kata / avatar | [sambasku/images](https://github.com/sambasku/images) via jsDelivr; tampilan di-resize lewat wsrv (`displayImageUrl`) |
| Audio pelafalan | [sambasku/audios](https://github.com/sambasku/audios) via jsDelivr |

## Struktur singkat

```text
app/
├── routes/              # file-based routes (SSR)
├── presentation/        # komponen UI + utils (display-image-url, SEO)
├── application/         # use-case / formatter
├── domain/              # tipe murni
├── infrastructure/      # apiClient (fetch)
└── worker.ts            # entry Cloudflare Workers + security headers
```

## Scripts

| Perintah | Fungsi |
| --- | --- |
| `pnpm install` | Pasang dependensi |
| `pnpm dev` | Dev server SSR di workerd (port 5173) |
| `pnpm typecheck` | `react-router typegen` + `tsc -b` |
| `pnpm lint` | ESLint (0 warning) |
| `pnpm build` | Build production → `dist/client` + `dist/server` |
| `pnpm build:staging` | Build mode staging |

## Deploy

Deploy **murni lewat CI/CD** (`.github/workflows/deploy-staging.yml` /
`deploy-production.yml`): push ke branch terkait → typecheck + lint +
build → `wrangler deploy` memakai config di `dist/server/wrangler.json`.

Custom domain Worker diikat sekali di dashboard Cloudflare
(Workers → Domains & Routes). Staging harus tetap `*.iamutaki.com`
supaya konsisten dengan domain API.

## Yang tidak dilakukan di repo ini

- Tidak ada login / sesi pengguna (itu admin + mobile)
- Tidak menulis file ke GitHub asset repo (itu API)
- Jangan deploy ke Cloudflare Pages: SSR butuh Worker
