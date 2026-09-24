import type { Resource } from 'i18next';
import id from './locales/id.json';
import idSbs from './locales/id-SBS.json';

/** Satu namespace `translation` per locale; key ber-prefix (home_*, faq_*, …). */
export const i18nResources = {
  id: { translation: id },
  'id-SBS': { translation: idSbs },
} satisfies Resource;

export const I18N_DEFAULT_NS = 'translation' as const;
