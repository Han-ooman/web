/**
 * @deprecated FAQ chrome + items sekarang di katalog i18n
 * `app/application/i18n/locales/{locale}/faq.json` (lihat WEB-I18N.md).
 * File ini tidak diimpor lagi; dibiarkan sementara sebagai referensi historis.
 */
export interface FaqItem {
  question: string;
  answer: string;
}

/** @deprecated Pakai `t('faq:items', { returnObjects: true })`. */
export const FAQ_ITEMS: FaqItem[] = [];
