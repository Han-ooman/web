/**
 * Satu sumber untuk UI FAQ + JSON-LD FAQPage.
 * Jawaban disusun dari copy yang sudah ada di web/mobile/docs produk
 * (bukan klaim baru). Plain text agar aman untuk schema.
 *
 * Sumber utama:
 * - mobile About / onboarding
 * - web home, footer, kontribusi, word detail
 * - docs/produk/tayang-belum-verifikasi.md
 * - web README + seo naming
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Apa itu SambasKu?',
    answer:
      'Kamus digital Sambas-Indonesia. Cari arti, baca contoh, usulkan kata, bookmark, dan bagikan kartu. Temukan arti kata, pelajari bahasa setempat, dan ikut menjaga warisan kata.',
  },
  {
    question: 'Apa hubungan SambasKu, Kamus Sambas, dan Kamus Digital Sambas-Indonesia?',
    answer:
      'SambasKu adalah nama merek aplikasi dan situs. Kamus Sambas adalah nama kamus yang dicari pengguna. Kamus Digital Sambas-Indonesia adalah sebutan deskriptif produk yang sama: kamus digital bahasa Sambas & Indonesia, atau kamus terbuka bahasa Melayu Sambas ke bahasa Indonesia.',
  },
  {
    question: 'Mengapa kamus ini dibuat?',
    answer:
      'Untuk pelestarian bahasa daerah - khususnya bahasa Melayu Sambas. Kamus ini dibangun secara kolaboratif bersama para penutur bahasa Melayu Sambas, didukung oleh penutur asli dan pegiat bahasa, agar kosakata terdokumentasi, mudah dipelajari, dan tetap hidup.',
  },
  {
    question: 'Apa yang bisa saya temukan di Kamus Sambas?',
    answer:
      'Kosakata, makna, terjemahan Indonesia, contoh kalimat, dan lafal otentik bahasa Melayu Sambas. Saat mencari, ketik lemma atau terjemahan; setiap entri dapat menampilkan kelas kata, definisi, contoh kalimat, dan variasi penulisan.',
  },
  {
    question: 'Apakah saya perlu login untuk mencari kata di situs?',
    answer:
      'Tidak. Pengunjung mencari dan membaca kata sebagai tamu, tanpa login. Siapa pun dapat mencari tanpa login.',
  },
  {
    question: 'Bagaimana cara mengajukan kata baru di situs web?',
    answer:
      'Lewat halaman Kontribusi (“Ajukan Kata Baru”). Dikirim sebagai tamu. Kata belum tayang. Tim akan memeriksanya dulu, lalu menampilkannya di daftar kata. Terima kasih menjaga bahasa Sambas tetap hidup.',
  },
  {
    question: 'Bagaimana kontribusi di aplikasi mobile?',
    answer:
      'Warga mengusulkan kata baru atau perbaikan. Di aplikasi, usulan langsung tayang dengan label Menunggu pengecekan. Kontributor bisa mengajukan diri jadi verifikator. Cari lemma dengan cepat, usulkan kata baru atau perbaikan, dan bookmark entri favorit untuk dibaca ulang.',
  },
  {
    question: 'Apa arti badge Terverifikasi dan Menunggu pengecekan?',
    answer:
      'Chip Terverifikasi menandakan entri sudah diperiksa. Chip Menunggu pengecekan berarti kata belum diperiksa tim Sambasku. Artinya atau terjemahannya bisa saja kurang tepat. Kata hari ini hanya yang sudah published dan Terverifikasi.',
  },
  {
    question: 'Siapa yang merawat kamus ini?',
    answer:
      'Bersama warga Sambas. Kamus ini dirawat orang-orang yang mengusulkan kata, memeriksa entri, dan merekam pelafalan. Pengusul mengirim kata baru atau perbaikan. Verifikator memeriksa usulan sebelum masuk kamus. Kontributor pelafalan merekam cara mengucapkan kata agar bisa didengar.',
  },
  {
    question: 'Apakah akses pencarian berbayar? Di mana kode sumbernya?',
    answer:
      'Situs dan aplikasi ditujukan untuk akses publik tanpa biaya pencarian. Kode sumber proyek tersedia di GitHub (github.com/iamutaki/sambasku) agar transparan dan dapat dikembangkan bersama komunitas.',
  },
  {
    question: 'Ada aplikasi mobile-nya?',
    answer:
      'Ada. Aplikasi Android SambasKu tersedia di Google Play (paket com.iamutaki.sambasku) untuk mencari dan menjelajah kamus di ponsel, melengkapi pengalaman di situs web. Subtitle aplikasi: Kamus Digital Sambas-Indonesia.',
  },
];
