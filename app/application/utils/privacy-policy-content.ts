/**
 * Kebijakan Privasi SambasKu: bahasa pengguna (bukan daftar SDK).
 * Isi tetap selaras dengan data yang diproses aplikasi + API.
 */

export interface PrivacySection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export const PRIVACY_EFFECTIVE_DATE = '23 September 2026';

export const PRIVACY_LAST_UPDATED = PRIVACY_EFFECTIVE_DATE;

export const PRIVACY_CONTACT =
  'Untuk pertanyaan privasi, buka isu di https://github.com/iamutaki/sambasku atau hubungi pengelola melalui saluran resmi SambasKu yang tertera di aplikasi maupun situs.';

export const PRIVACY_INTRO = [
  'Kebijakan Privasi ini menjelaskan bagaimana SambasKu (“kami”, “aplikasi”, atau “layanan”) mengumpulkan, menggunakan, menyimpan, dan melindungi informasi ketika Anda menggunakan situs web dan aplikasi Android SambasKu.',
  'Dengan menggunakan SambasKu, Anda menyetujui praktik yang diuraikan di sini. Jika Anda tidak setuju, mohon jangan menggunakan layanan.',
];

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: 'pengontrol',
    title: '1. Pengontrol data',
    paragraphs: [
      'Pengontrol data untuk layanan SambasKu adalah pengelola proyek SambasKu. SambasKu adalah kamus digital kolaboratif bahasa Melayu Sambas-Indonesia.',
    ],
  },
  {
    id: 'cakupan',
    title: '2. Cakupan',
    paragraphs: ['Kebijakan ini berlaku untuk:'],
    bullets: [
      'Situs web SambasKu (termasuk pencarian kata, kontribusi, dan halaman terkait)',
      'Aplikasi seluler SambasKu di Android',
      'Layanan backend yang mendukung login, kamus, kontribusi, notifikasi, dan unggahan media',
    ],
  },
  {
    id: 'data-dikumpulkan',
    title: '3. Data yang kami kumpulkan',
    paragraphs: [
      'Jenis data bergantung pada fitur yang Anda gunakan. Kami tidak menjual data pribadi Anda.',
    ],
    bullets: [
      'Akun dan autentikasi: alamat email, nama atau username, kata sandi (disimpan dalam bentuk terenkripsi/hash di server), serta token sesi. Jika Anda masuk dengan Google, kami menerima pengenal dan informasi profil dasar yang Anda izinkan dari penyedia tersebut',
      'Profil: foto avatar (jika diunggah) dan data profil yang Anda pilih untuk ditampilkan secara publik',
      'Konten yang Anda kirim: usulan kata, makna, contoh kalimat, koreksi, komentar, laporan, pengajuan menjadi verifikator, serta lampiran gambar atau rekaman audio pelafalan. Laporan teknis dapat menyertakan versi aplikasi',
      'Perangkat dan notifikasi: pengenal perangkat, token layanan pemberitahuan push, serta preferensi notifikasi di perangkat',
      'Analitik: peristiwa penggunaan aplikasi secara agregat untuk memahami kualitas dan memperbaiki produk',
      'Izin perangkat (hanya saat fitur membutuhkannya dan setelah Anda mengizinkan): kamera atau galeri untuk unggah gambar, mikrofon untuk merekam pelafalan, akses galeri untuk menyimpan kartu yang dibagikan, serta notifikasi',
      'Berbagi dan media: konten yang Anda bagikan melalui menu berbagi sistem operasi; pemutaran audio atau video dari materi yang sudah tersedia di layanan',
      'Peta: tampilan peta untuk fitur eksplorasi; kami tidak menggunakan fitur ini untuk melacak lokasi perangkat Anda secara berkelanjutan',
      'Data teknis: alamat IP dan log permintaan di infrastruktur server untuk keamanan, diagnosis gangguan, dan ketersediaan layanan',
      'Penyimpanan di perangkat: preferensi aplikasi, token aman, cache gambar, dan file sementara yang diperlukan agar aplikasi berjalan',
      'Font daring: unduhan font dari Google Fonts; Google dapat memproses data teknis permintaan (misalnya alamat IP) sesuai kebijakan mereka',
    ],
  },
  {
    id: 'tidak-dikumpulkan',
    title: '4. Data yang tidak kami kumpulkan secara sengaja',
    paragraphs: [
      'Kami tidak meminta data sensitif seperti nomor identitas resmi, data keuangan, atau lokasi GPS akurat untuk fitur inti kamus. Peta eksplorasi hanya menampilkan konteks geografis dan tidak dipakai untuk pelacakan lokasi berkelanjutan.',
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
      'Meningkatkan kualitas aplikasi melalui analitik',
      'Mencegah penyalahgunaan, spam, dan pelanggaran ketentuan layanan',
      'Memenuhi kewajiban hukum bila diwajibkan',
    ],
  },
  {
    id: 'dasar-hukum',
    title: '6. Dasar pemrosesan',
    paragraphs: [
      'Pemrosesan dilakukan berdasarkan: (a) pelaksanaan layanan yang Anda minta; (b) persetujuan Anda (misalnya masuk dengan Google, izin kamera atau mikrofon, dan notifikasi); (c) kepentingan sah kami untuk keamanan, anti-penyalahgunaan, dan pengembangan produk; dan/atau (d) kewajiban hukum.',
    ],
  },
  {
    id: 'pihak-ketiga',
    title: '7. Layanan pihak ketiga',
    paragraphs: [
      'Kami menggunakan penyedia yang membantu menjalankan SambasKu. Mereka memproses data sesuai kebijakan masing-masing dan hanya sejauh diperlukan untuk layanan yang kami aktifkan:',
    ],
    bullets: [
      'Google: masuk dengan Google, Firebase (analitik dan pemberitahuan push), serta Google Fonts',
      'Cloudflare: hosting dan jaringan pengiriman layanan',
      'Turso: penyimpanan basis data aplikasi',
      'Resend: pengiriman email (kode verifikasi dan reset kata sandi)',
      'ImageKit: penyimpanan gambar privat tertentu (misalnya lampiran laporan)',
      'GitHub dan CDN publik: aset gambar kata, avatar, dan audio pelafalan yang bersifat publik',
      'OpenFreeMap / MapLibre: tampilan peta untuk fitur eksplorasi',
      'Google Play: distribusi dan pembaruan aplikasi Android',
      'Aplikasi lain di perangkat Anda: hanya jika Anda memilih membagikan konten melalui menu berbagi sistem',
    ],
  },
  {
    id: 'berbagi',
    title: '8. Pembagian data',
    paragraphs: [
      'Kami tidak menjual data pribadi. Data dapat dibagikan hanya kepada: (a) penyedia di bagian 7 sebagai pemroses; (b) otoritas hukum jika diwajibkan; (c) publik, untuk konten yang Anda buat dan bersifat publik di kamus (misalnya kata atau definisi yang disetujui, username publik, dan avatar).',
    ],
  },
  {
    id: 'retensi',
    title: '9. Retensi',
    paragraphs: [
      'Data akun dan konten disimpan selama akun aktif atau selama diperlukan untuk layanan kamus dan audit. Log teknis disimpan dalam jangka waktu wajar untuk keamanan.',
      'Anda dapat menghapus akun kapan saja: di aplikasi Android lewat Profil → Hapus akun, atau lewat situs di https://sambasku.com/hapus-akun (kode dikirim ke email). Penghapusan langsung menghapus nama, email, nomor HP, kata sandi, avatar, sesi, token notifikasi, bookmark, dan data pribadi pada pengajuan verifikator serta laporan bug. Entri kamus, komentar, dan kontribusi yang sudah tayang tetap ada tanpa nama akun.',
    ],
  },
  {
    id: 'keamanan',
    title: '10. Keamanan',
    paragraphs: [
      'Kami menerapkan langkah yang wajar, termasuk koneksi terenkripsi (HTTPS), penyimpanan kata sandi yang di-hash, perlindungan token di perangkat, dan kontrol akses di server. Tidak ada metode transmisi atau penyimpanan elektronik yang sepenuhnya aman; kami tidak dapat menjamin keamanan absolut.',
    ],
  },
  {
    id: 'hak',
    title: '11. Hak Anda',
    paragraphs: [
      'Sesuai hukum yang berlaku, Anda dapat meminta akses, koreksi, penghapusan, atau pembatasan pemrosesan, serta menarik persetujuan (misalnya mencabut izin notifikasi atau kamera di pengaturan perangkat, atau memutuskan tautan akun Google). Penghapusan akun tersedia di aplikasi (Profil → Hapus akun) dan di https://sambasku.com/hapus-akun. Untuk permintaan lain, hubungi kami melalui saluran di bagian Kontak.',
    ],
  },
  {
    id: 'anak',
    title: '12. Anak-anak',
    paragraphs: [
      'SambasKu tidak ditujukan khusus untuk anak di bawah 13 tahun (atau usia minimum lain yang berlaku di yurisdiksi Anda). Kami tidak dengan sengaja mengumpulkan data pribadi dari anak-anak. Jika Anda percaya anak telah memberikan data kepada kami, hubungi kami agar data tersebut dapat dihapus.',
    ],
  },
  {
    id: 'internasional',
    title: '13. Transfer internasional',
    paragraphs: [
      'Infrastruktur dan penyedia kami dapat memproses data di server di luar negara tempat Anda tinggal. Dengan menggunakan layanan, Anda memahami bahwa data dapat dipindahkan ke yurisdiksi tersebut dengan perlindungan yang wajar.',
    ],
  },
  {
    id: 'perubahan',
    title: '14. Perubahan kebijakan',
    paragraphs: [
      'Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Tanggal “Terakhir diperbarui” di halaman ini akan diubah. Penggunaan berkelanjutan setelah perubahan berarti Anda menerima kebijakan yang diperbarui, sejauh diizinkan hukum.',
    ],
  },
  {
    id: 'kontak',
    title: '15. Kontak',
    paragraphs: [PRIVACY_CONTACT],
  },
];
