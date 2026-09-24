import i18next, { type i18n as I18nInstance, type TFunction } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, type AppLocale, isAppLocale } from './locales';
import { I18N_DEFAULT_NS, i18nResources } from './resources';

const sharedInit = {
  resources: i18nResources,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: Object.keys(i18nResources),
  ns: [I18N_DEFAULT_NS],
  defaultNS: I18N_DEFAULT_NS,
  interpolation: { escapeValue: false },
  returnNull: false,
  react: { useSuspense: false },
};

/** Katalog immutable untuk getFixedT di meta()/JSON-LD (aman concurrency Worker). */
let catalog: I18nInstance | null = null;

function getCatalog(): I18nInstance {
  if (!catalog) {
    catalog = i18next.createInstance();
    void catalog.init({
      ...sharedInit,
      lng: DEFAULT_LOCALE,
    });
  }
  return catalog;
}

export function getFixedT(locale: AppLocale | string): TFunction {
  const lng = isAppLocale(locale) ? locale : DEFAULT_LOCALE;
  return getCatalog().getFixedT(lng);
}

/** Instance per locale untuk I18nextProvider (SSR + client). */
export function createI18nInstance(locale: AppLocale): I18nInstance {
  const instance = i18next.createInstance();
  void instance.use(initReactI18next).init({
    ...sharedInit,
    lng: locale,
  });
  return instance;
}
