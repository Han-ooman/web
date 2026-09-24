import i18next, { type i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, type AppLocale, isAppLocale } from './locales';
import { I18N_DEFAULT_NS, i18nResources } from './resources';

let clientInstance: I18nInstance | null = null;

/** Singleton browser: ganti bahasa lewat changeLanguage saat navigasi locale. */
export function getClientI18n(locale: AppLocale): I18nInstance {
  const lng = isAppLocale(locale) ? locale : DEFAULT_LOCALE;
  if (!clientInstance) {
    clientInstance = i18next.createInstance();
    void clientInstance.use(initReactI18next).init({
      resources: i18nResources,
      lng,
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: Object.keys(i18nResources),
      ns: [I18N_DEFAULT_NS],
      defaultNS: I18N_DEFAULT_NS,
      interpolation: { escapeValue: false },
      returnNull: false,
      react: { useSuspense: false },
    });
    return clientInstance;
  }
  if (clientInstance.language !== lng) {
    void clientInstance.changeLanguage(lng);
  }
  return clientInstance;
}
