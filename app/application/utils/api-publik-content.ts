/**
 * Konten halaman dokumentasi API publik (baca kamus).
 * Base URL produksi: https://api.sambasku.com/api/v1
 */

export const API_PUBLIK_BASE = 'https://api.sambasku.com/api/v1';

export const API_PUBLIK_INTRO = [
  'API publik SambasKu untuk membaca kamus Melayu Sambas. Tanpa login. Respons memakai envelope JSON standar: success, data, dan meta (pagination bila ada).',
  'Batas: 100 permintaan per menit per IP. Saat terlampaui, respons 429 dengan header Retry-After (detik). Hanya kata berstatus published. Draf dan kata belum tayang tidak tersedia di endpoint ini.',
  'CORS: permintaan baca dari origin mana pun diizinkan (Access-Control-Allow-Origin). Permintaan ber-credentials (cookie/Authorization) hanya dari origin yang diizinkan situs dan konsol.',
];

export const API_PUBLIK_ATTRIBUTION =
  'Konten kata (lemma, makna, terjemahan, contoh) bebas dikutip dengan tautan ke halaman katanya di https://sambasku.com. Cantumkan sumber bila data dipakai ulang di produk atau dataset.';

export const API_PUBLIK_TOC: Array<{ id: string; label: string }> = [
  { id: 'search', label: 'Cari kata' },
  { id: 'lemma', label: 'Detail by lemma' },
  { id: 'list', label: 'Daftar A-Z' },
  { id: 'by-id', label: 'Detail by id' },
];

export interface ApiPublikParam {
  name: string;
  detail: string;
}

export interface ApiPublikEndpoint {
  id: string;
  title: string;
  method: 'GET';
  path: string;
  summary: string;
  params?: ApiPublikParam[];
  notes?: string[];
  curls: string[];
  sampleJson: string;
}

/** Dua endpoint utama: dokumentasi penuh. */
export const API_PUBLIK_PRIMARY: ApiPublikEndpoint[] = [
  {
    id: 'search',
    title: 'Cari kata',
    method: 'GET',
    path: '/words/search',
    summary:
      'Pencarian kosakata. Arah default Sambas ke Indonesia (lemma). Pakai search_in=translation untuk Indonesia ke Sambas.',
    params: [
      { name: 'q', detail: 'Kata kunci (trim, maks 255). Kosong = daftar kosong / tanpa hasil bermakna.' },
      { name: 'limit', detail: '1-100, default 20.' },
      { name: 'cursor', detail: 'Cursor opaque ULID dari meta.next_cursor halaman sebelumnya.' },
      {
        name: 'search_in',
        detail: 'lemma (default) atau translation.',
      },
      {
        name: 'word_type',
        detail: 'Opsional: word | idiom | peribahasa | ungkapan.',
      },
      {
        name: 'is_verified',
        detail: 'Opsional: true | false. Omit = semua yang tayang.',
      },
    ],
    notes: [
      'Item list memuat lemma, word_type, status, is_verified, dan sense (gloss singkat seperti [n] gelas).',
      'Bila search_in=translation, item bisa punya matched_translation.',
      'Cache respons: Cache-Control public, max-age=60, s-maxage=300.',
    ],
    curls: [
      `curl -sS '${API_PUBLIK_BASE}/words/search?q=cawan&limit=5'`,
      `curl -sS '${API_PUBLIK_BASE}/words/search?q=gelas&search_in=translation&limit=5'`,
    ],
    sampleJson: `{
  "success": true,
  "data": [
    {
      "id": "01JDWORD…",
      "lemma": "cawan",
      "word_type": "word",
      "status": "published",
      "is_verified": true,
      "sense": "[n] gelas"
    }
  ],
  "meta": {
    "limit": 5,
    "next_cursor": null,
    "has_more": false
  }
}`,
  },
  {
    id: 'lemma',
    title: 'Detail kata by lemma',
    method: 'GET',
    path: '/words/lemma/:lemma',
    summary:
      'Detail lengkap satu kata published. Path yang sama dipakai situs publik (/id/words/{lemma}). Encode karakter khusus di lemma (spasi, apostrof).',
    params: [
      {
        name: 'lemma',
        detail:
          'Segment path, case-insensitive (Cawan = cawan). EncodeURIComponent wajib untuk spasi dan apostrof.',
      },
    ],
    notes: [
      'Field penting: lemma, is_verified, meanings[].definition, meanings[].translations, examples, pronunciations, images.',
      '404 bila lemma tidak ditemukan atau tidak published.',
      'Homonim: bila ada beberapa published dengan lemma sama (beda huruf besar/kecil), dipilih yang is_verified=true dulu, lalu yang paling lama dibuat.',
      'Cache respons: Cache-Control public, max-age=60, s-maxage=300.',
    ],
    curls: [
      `curl -sS '${API_PUBLIK_BASE}/words/lemma/cawan'`,
      `curl -sS '${API_PUBLIK_BASE}/words/lemma/kappa%27'`,
      `curl -sS '${API_PUBLIK_BASE}/words/lemma/Daan%20keladaan'`,
    ],
    sampleJson: `{
  "success": true,
  "data": {
    "id": "01JDWORD…",
    "lemma": "cawan",
    "word_type": "word",
    "status": "published",
    "is_verified": true,
    "meanings": [
      {
        "definition": "tempat untuk minum…",
        "translations": [
          { "translation_text": "gelas", "translation_type": "direct" }
        ],
        "examples": []
      }
    ]
  }
}`,
  },
];

/** Endpoint pendukung: ringkas saja. */
export const API_PUBLIK_SECONDARY: ApiPublikEndpoint[] = [
  {
    id: 'list',
    title: 'Daftar A-Z',
    method: 'GET',
    path: '/words',
    summary:
      'Browsing korpus urut lemma. Filter letter (satu huruf A-Z), q (contains), is_verified=true untuk lemma yang boleh diindeks sitemap, cursor komposit opaque (beda bentuk dari /search).',
    curls: [`curl -sS '${API_PUBLIK_BASE}/words?is_verified=true&limit=20'`],
    sampleJson: `{
  "success": true,
  "data": [
    {
      "lemma": "cawan",
      "is_verified": true,
      "updated_at": "2026-09-26T03:00:00.000Z",
      "sense": "[n] gelas"
    }
  ],
  "meta": { "limit": 20, "next_cursor": "…", "has_more": true }
}`,
  },
  {
    id: 'by-id',
    title: 'Detail kata by id',
    method: 'GET',
    path: '/words/:id',
    summary:
      'Sama bentuk respons dengan /words/lemma/:lemma. :id adalah ULID 26 karakter. Berguna untuk backlink lama yang memakai id, bukan lemma.',
    curls: [`curl -sS '${API_PUBLIK_BASE}/words/01JDWORDMAKATN000000000000'`],
    sampleJson: `{ "success": true, "data": { "id": "01JDWORD…", "lemma": "…" } }`,
  },
];

export const API_PUBLIK_OUT_OF_SCOPE =
  'Endpoint lain (kata hari ini, feed terbaru, admin) tidak dibahas di halaman ini. Fokus halaman: baca kamus untuk aplikasi, agen, dan peneliti. Dump korpus terverifikasi untuk agen: https://sambasku.com/llms-full.txt';
