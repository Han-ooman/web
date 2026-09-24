import type { WordDetail } from '@/domain/entities/word.entity';
import { env } from '@/infrastructure/config/env';
import { getFixedT } from '@/application/i18n/i18n-instance';
import {
  DEFAULT_LOCALE,
  type AppLocale,
  getLocaleConfig,
  isAppLocale,
  localePath,
  seoLocales,
} from '@/application/i18n/locales';

export interface SeoMetaProps {
  title: string;
  description: string;
  /** Path sudah ber-prefix locale, mis. `/id/words/somet` */
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  locale?: AppLocale | string;
  /**
   * Halaman hasil pencarian/thin-content: noindex di SEMUA environment
   * (panduan search engine untuk search results page).
   */
  noindexAlways?: boolean;
}

function resolveLocale(locale?: string): AppLocale {
  return isAppLocale(locale) ? locale : DEFAULT_LOCALE;
}

/** Path tanpa query, untuk pasangan hreflang. */
function pathWithoutQuery(path: string): string {
  return path.split('?')[0] || '/';
}

/**
 * Dari path ber-locale `/id/words/x` → path relatif tanpa locale `/words/x`.
 */
function barePathFromLocalized(path: string): string {
  const clean = pathWithoutQuery(path);
  const { path: bare } = (() => {
    const segments = clean.split('/').filter(Boolean);
    if (segments[0] && isAppLocale(segments[0])) {
      const rest = segments.slice(1);
      return { path: rest.length ? `/${rest.join('/')}` : '/' };
    }
    return { path: clean.startsWith('/') ? clean : `/${clean}` };
  })();
  return bare;
}

export function buildHreflangLinks(localizedPath: string) {
  if (!env.isProd) return [];
  const bare = barePathFromLocalized(localizedPath);
  const links: Array<{
    tagName: 'link';
    rel: string;
    hrefLang: string;
    href: string;
  }> = seoLocales().map((l) => ({
    tagName: 'link' as const,
    rel: 'alternate',
    hrefLang: l.code,
    href: `${env.appUrl}${localePath(l.code, bare)}`,
  }));
  links.push({
    tagName: 'link',
    rel: 'alternate',
    hrefLang: 'x-default',
    href: `${env.appUrl}${localePath(DEFAULT_LOCALE, bare)}`,
  });
  return links;
}

export function buildMetaTags({
  title,
  description,
  path = '',
  image,
  type = 'website',
  locale: localeInput,
  noindexAlways = false,
}: SeoMetaProps) {
  const locale = resolveLocale(localeInput);
  const localeCfg = getLocaleConfig(locale);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${env.appUrl}${normalizedPath}`;
  const canonical = `${env.appUrl}${pathWithoutQuery(normalizedPath) || '/'}`;
  const siteName = env.appName;
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const finalImage = image ?? `${env.appUrl}/logo.png`;
  const noindex = noindexAlways || !env.isProd;
  const twitterCard = image ? 'summary_large_image' : 'summary';

  const ogAlternates = seoLocales()
    .filter((l) => l.code !== locale)
    .map((l) => ({
      property: 'og:locale:alternate' as const,
      content: l.ogLocale,
    }));

  return [
    { title: fullTitle },
    { name: 'description', content: description },
    ...(noindex
      ? [{ name: 'robots', content: 'noindex, nofollow' }]
      : [
          { tagName: 'link' as const, rel: 'canonical', href: canonical },
          ...buildHreflangLinks(normalizedPath),
        ]),
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:site_name', content: siteName },
    { property: 'og:locale', content: localeCfg.ogLocale },
    ...ogAlternates,
    { property: 'og:type', content: type },
    { property: 'og:image', content: finalImage },
    { name: 'twitter:card', content: twitterCard },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: finalImage },
  ];
}

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.iamutaki.sambasku';
const GITHUB_URL = 'https://github.com/sambasku';

export function buildHomeJsonLd(localeInput?: string) {
  const locale = resolveLocale(localeInput);
  const t = getFixedT(locale);
  const homeUrl = `${env.appUrl}${localePath(locale, '/')}`;
  const websiteId = `${homeUrl}#website`;
  const organizationId = `${env.appUrl}/#organization`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': websiteId,
        name: t('seo_websiteName'),
        alternateName: [env.appName, t('seo_websiteAlternateName')],
        url: homeUrl,
        description: t('seo_homeDescription'),
        inLanguage: locale,
        publisher: { '@id': organizationId },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${env.appUrl}${localePath(locale, '/search')}?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: env.appName,
        url: env.appUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${env.appUrl}/favicon-192.png`,
        },
        sameAs: [PLAY_STORE_URL, GITHUB_URL],
      },
    ],
  };
}

const SEO_DESCRIPTION_MAX = 158;

function truncateSeo(text: string, max = SEO_DESCRIPTION_MAX): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd();
  return `${base}…`;
}

function firstIndonesianTranslation(word: WordDetail): string | null {
  const texts = word.meanings[0]?.translations
    ?.map((tr) => tr.translation_text.trim())
    .filter(Boolean);
  return texts?.[0] ?? null;
}

export function buildWordSeoCopy(
  word: WordDetail,
  localeInput?: string,
): { title: string; description: string } {
  const locale = resolveLocale(localeInput);
  const t = getFixedT(locale);
  const lemma = word.lemma;
  const firstMeaning = word.meanings[0];
  const definition =
    firstMeaning?.definition?.trim() || t('word_seoDescFallbackDefinition');
  const translation = firstIndonesianTranslation(word);

  const title = t('word_seoTitleTemplate', { lemma });

  const parts = [
    t('word_seoDescDefinition', { lemma, definition }),
    translation ? t('word_seoDescTranslation', { translation }) : null,
    t('word_seoDescSuffix'),
  ].filter(Boolean);

  return {
    title,
    description: truncateSeo(parts.join(' ')),
  };
}

export function buildFaqJsonLd(localeInput?: string) {
  const locale = resolveLocale(localeInput);
  const t = getFixedT(locale);
  const items = t('faq_items', { returnObjects: true }) as Array<{
    question: string;
    answer: string;
  }>;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: t('faq_jsonLdName'),
    url: `${env.appUrl}${localePath(locale, '/faq')}`,
    inLanguage: locale,
    mainEntity: (Array.isArray(items) ? items : []).map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildWordJsonLd(word: WordDetail, localeInput?: string) {
  const locale = resolveLocale(localeInput);
  const t = getFixedT(locale);
  const { description } = buildWordSeoCopy(word, locale);
  const translation = firstIndonesianTranslation(word);
  const primaryImage =
    word.images.find((img) => img.is_primary)?.url ?? word.images[0]?.url;
  const wordUrl = `${env.appUrl}${localePath(locale, `/words/${encodeURIComponent(word.lemma)}`)}`;
  const wordsIndexUrl = `${env.appUrl}${localePath(locale, '/words')}`;
  const homeUrl = `${env.appUrl}${localePath(locale, '/')}`;

  const definedTerm = {
    '@type': 'DefinedTerm',
    '@id': `${wordUrl}#term`,
    name: word.lemma,
    alternateName: translation
      ? [t('word_alternateNameSuffix', { lemma: word.lemma }), translation]
      : [t('word_alternateNameSuffix', { lemma: word.lemma })],
    termCode: word.id,
    description,
    url: wordUrl,
    inLanguage: locale,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: t('seo_websiteName'),
      alternateName: [env.appName, t('seo_websiteAlternateName')],
      url: homeUrl,
      inLanguage: locale,
    },
    ...(primaryImage ? { image: primaryImage } : {}),
  };

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${wordUrl}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: t('word_homeCrumb'),
        item: homeUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: t('word_wordsCrumb'),
        item: wordsIndexUrl,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: word.lemma,
        item: wordUrl,
      },
    ],
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [definedTerm, breadcrumb],
  };
}
