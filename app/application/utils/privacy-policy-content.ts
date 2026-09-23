/**
 * Kebijakan Privasi SambasKu — selaras dengan data yang diproses
 * aplikasi Flutter (mobile/pubspec.yaml) + API.
 *
 * Ditulis mengikuti struktur umum privacy policy generator (Play /
 * App Store): identitas pengontrol, data yang dikumpulkan, tujuan,
 * pihak ketiga, hak pengguna, retensi, keamanan, anak, perubahan.
 */

export interface PrivacySection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

/** Tanggal efektif (ISO date display ID). */
export const PRIVACY_EFFECTIVE_DATE = '23 September 2026';

export const PRIVACY_LAST_UPDATED = PRIVACY_EFFECTIVE_DATE;

export const PRIVACY_CONTACT =
  'Untuk pertanyaan privasi, buka isu di https://github.com/iamutaki/sambasku atau hubungi pengelola melalui saluran resmi SambasKu yang tertera di aplikasi/situs.';

export const PRIVACY_INTRO = [
  'Kebijakan Privasi ini menjelaskan bagaimana SambasKu (“kami”, “aplikasi”, “layanan”) mengumpulkan, menggunakan, menyimpan, dan melindungi informasi ketika Anda menggunakan situs web SambasKu dan aplikasi Android SambasKu (package com.iamutaki.sambasku).',
  'Dengan menggunakan SambasKu, Anda menyetujui praktik yang diuraikan di sini. Jika Anda tidak setuju, mohon jangan menggunakan layanan.',
];

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: 'pengontrol',
    title: '1. Pengontrol data',
    paragraphs: [
      'Pengontrol data untuk layanan SambasKu adalah pengelola proyek SambasKu (identitas developer terkait com.iamutaki.sambasku). SambasKu adalah kamus digital kolaboratif bahasa Melayu Sambas–Indonesia.',
    ],
  },
  {
    id: 'cakupan',
    title: '2. Cakupan',
    paragraphs: [
      'Kebijakan ini berlaku untuk:',
    ],
    bullets: [
      'Situs web SambasKu (termasuk pencarian kata, kontribusi, dan halaman terkait)',
      'Aplikasi seluler SambasKu di Android (flavor production dan staging)',
      'Layanan API backend yang mendukung fitur login, kamus, kontribusi, notifikasi, dan unggahan media',
    ],
  },
  {
    id: 'data-dikumpulkan',
    title: '3. Data yang kami kumpulkan',
    paragraphs: [
      'Jenis data bergantung pada fitur yang Anda gunakan. Kami tidak menjual data pribadi Anda.',
    ],
    bullets: [
      'Akun & autentikasi: alamat email, nama/username, kata sandi (disimpan ter-hash di server), token sesi; jika Anda masuk dengan Google Sign-In (`google_sign_in`) atau Facebook Login (`flutter_facebook_auth`), kami menerima pengenal dan profil dasar yang disediakan penyedia tersebut sesuai izin Anda',
      'Profil: foto avatar (jika diunggah lewat `image_picker` / `file_picker`), data profil publik yang Anda pilih untuk ditampilkan',
      'Konten yang Anda kirim: usulan kata, makna, contoh, koreksi, komentar, laporan bug/kata (dapat menyertakan versi aplikasi via `package_info_plus`), pengajuan verifikator, serta lampiran gambar atau rekaman audio pelafalan (`record`)',
      'Perangkat & push: pengenal perangkat (`flutter_udid`), token Firebase Cloud Messaging (`firebase_messaging` + `firebase_core`), notifikasi lokal (`awesome_notifications`)',
      'Analitik aplikasi: peristiwa penggunaan melalui Firebase Analytics (`firebase_analytics`) untuk memahami kualitas produk',
      'Izin perangkat (`permission_handler`, hanya saat fitur membutuhkannya): kamera/galeri (unggah gambar), mikrofon (rekam pelafalan), penyimpanan/galeri (`gal` untuk menyimpan kartu share), notifikasi',
      'Berbagi & media: konten yang Anda bagikan lewat lembar share sistem (`share_plus`); pemutaran audio/video di aplikasi (`just_audio`, `video_player`) dari URL yang sudah ada di layanan (tanpa merekam aktivitas di luar aplikasi)',
      'Peta: ubin peta ditampilkan lewat MapLibre (`maplibre_gl`); tidak digunakan untuk pelacakan GPS berkelanjutan',
      'Data teknis jaringan: permintaan HTTP ke API SambasKu (`dio` / `retrofit`), termasuk alamat IP dan log di infrastruktur server untuk keamanan dan ketersediaan',
      'Penyimpanan lokal di perangkat: preferensi (`shared_preferences`), token aman (`flutter_secure_storage`), cache gambar (`cached_network_image`), file sementara (`path_provider`)',
      'Font jarak jauh: unduhan font lewat Google Fonts (`google_fonts`) — penyedia dapat memproses permintaan teknis (misalnya IP) sesuai kebijakan Google',
    ],
  },
  {
    id: 'tidak-dikumpulkan',
    title: '4. Data yang tidak kami kumpulkan secara sengaja',
    paragraphs: [
      'Kami tidak meminta data sensitif seperti nomor KTP, data keuangan, atau lokasi GPS akurat untuk fitur inti kamus. Peta eksplorasi memakai peta OpenFreeMap/MapLibre untuk menampilkan konteks geografis; kami tidak menggunakan itu untuk melacak lokasi perangkat Anda secara berkelanjutan.',
    ],
  },
  {
    id: 'tujuan',
    title: '5. Tujuan pemrosesan',
    paragraphs: ['Data digunakan untuk:'],
    bullets: [
      'Menyediakan dan memelihara kamus, pencarian, dan tampilan entri',
      'Autentikasi, keamanan sesi, dan pemulihan kata sandi',
      'Memproses kontribusi komunitas dan alur verifikasi',
      'Mengirim notifikasi terkait aktivitas yang Anda aktifkan',
      'Meningkatkan kualitas aplikasi melalui analitik agregat',
      'Mencegah penyalahgunaan, spam, dan pelanggaran ketentuan layanan',
      'Memenuhi kewajiban hukum bila diwajibkan',
    ],
  },
  {
    id: 'dasar-hukum',
    title: '6. Dasar pemrosesan',
    paragraphs: [
      'Pemrosesan dilakukan berdasarkan: (a) pelaksanaan kontrak layanan yang Anda minta; (b) persetujuan Anda (misalnya login sosial, izin kamera/mikrofon, push notification); (c) kepentingan sah kami untuk keamanan, anti-penyalahgunaan, dan pengembangan produk; dan/atau (d) kewajiban hukum.',
    ],
  },
  {
    id: 'pihak-ketiga',
    title: '7. Layanan pihak ketiga',
    paragraphs: [
      'Kami memakai penyedia yang membantu menjalankan SambasKu. Mereka memproses data sesuai kebijakan mereka sendiri dan hanya sejauh diperlukan untuk layanan yang kami aktifkan:',
    ],
    bullets: [
      'Google (Google Sign-In, Firebase Core / Analytics / Cloud Messaging, Google Fonts) — autentikasi, analitik, push, distribusi font',
      'Meta / Facebook (Facebook Login) — autentikasi opsional',
      'Cloudflare — hosting Workers/Pages dan jaringan edge',
      'Turso / LibSQL — penyimpanan basis data aplikasi',
      'Resend — pengiriman email (OTP, reset kata sandi)',
      'ImageKit — penyimpanan gambar privat tertentu (mis. lampiran laporan / bukti)',
      'GitHub + CDN (jsDelivr / wsrv) — aset gambar kata/avatar dan audio pelafalan publik',
      'OpenFreeMap / MapLibre — ubin peta untuk fitur eksplorasi',
      'Google Play / layanan distribusi aplikasi — instalasi dan pembaruan aplikasi Android',
      'Aplikasi lain di perangkat — hanya jika Anda memilih membagikan konten lewat share sheet sistem (`share_plus`)',
    ],
  },
  {
    id: 'berbagi',
    title: '8. Pembagian data',
    paragraphs: [
      'Kami tidak menjual data pribadi. Data dapat dibagikan hanya kepada: (a) penyedia di bagian 7 sebagai pemroses; (b) otoritas hukum jika diwajibkan; (c) publik, untuk konten yang Anda buat bersifat publik di kamus (misalnya lemma/definisi yang disetujui, username publik, avatar).',
    ],
  },
  {
    id: 'retensi',
    title: '9. Retensi',
    paragraphs: [
      'Data akun dan konten disimpan selama akun aktif atau selama diperlukan untuk layanan kamus dan audit. Log teknis disimpan dalam jangka waktu wajar untuk keamanan. Anda dapat meminta penghapusan akun/data melalui saluran kontak di bawah; kami akan memproses sejauh diizinkan hukum dan kebutuhan operasional (misalnya salinan kontribusi yang sudah menjadi bagian kamus publik dapat tetap ada dalam bentuk teranonimisasi atau sebagai konten komunitas).',
    ],
  },
  {
    id: 'keamanan',
    title: '10. Keamanan',
    paragraphs: [
      'Kami menerapkan langkah wajar: transportasi HTTPS, hash kata sandi, token sensitif di penyimpanan aman perangkat, dan kontrol akses di server. Tidak ada metode transmisi atau penyimpanan elektronik yang 100% aman; kami tidak dapat menjamin keamanan absolut.',
    ],
  },
  {
    id: 'hak',
    title: '11. Hak Anda',
    paragraphs: [
      'Sesuai hukum yang berlaku, Anda dapat meminta akses, koreksi, penghapusan, pembatasan pemrosesan, atau menarik persetujuan (misalnya mencabut izin notifikasi/kamera di pengaturan perangkat, atau memutuskan tautan akun Google/Facebook). Untuk permintaan terkait akun di server, hubungi kami melalui saluran di bagian Kontak.',
    ],
  },
  {
    id: 'anak',
    title: '12. Anak-anak',
    paragraphs: [
      'SambasKu tidak ditujukan khusus untuk anak di bawah 13 tahun (atau usia minimum lain yang berlaku di yurisdiksi Anda). Kami tidak dengan sengaja mengumpulkan data pribadi dari anak-anak. Jika Anda percaya anak telah memberikan data kepada kami, hubungi kami agar dapat dihapus.',
    ],
  },
  {
    id: 'internasional',
    title: '13. Transfer internasional',
    paragraphs: [
      'Infrastruktur dan penyedia kami dapat memproses data di server di luar negara tempat Anda tinggal (misalnya wilayah cloud penyedia). Dengan menggunakan layanan, Anda memahami bahwa data dapat dipindahkan ke yurisdiksi tersebut dengan perlindungan yang wajar.',
    ],
  },
  {
    id: 'perubahan',
    title: '14. Perubahan kebijakan',
    paragraphs: [
      'Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Tanggal “Terakhir diperbarui” di atas halaman ini akan diubah. Penggunaan berkelanjutan setelah perubahan berarti Anda menerima kebijakan yang diperbarui, sejauh diizinkan hukum.',
    ],
  },
  {
    id: 'kontak',
    title: '15. Kontak',
    paragraphs: [PRIVACY_CONTACT],
  },
];
