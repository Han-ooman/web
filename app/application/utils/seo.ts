import type { WordDetail } from '@/domain/entities/word.entity';
import { env } from '@/infrastructure/config/env';
import { FAQ_ITEMS } from '@/application/utils/faq-content';

export interface SeoMetaProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  /**
   * Halaman hasil pencarian/thin-content: noindex di SEMUA environment
   * (panduan search engine untuk search results page).
   */
  noindexAlways?: boolean;
}

export function buildMetaTags({
  title,
  description,
  path = '',
  image,
  type = 'website',
  noindexAlways = false,
}: SeoMetaProps) {
  const url = `${env.appUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const canonical = `${env.appUrl}${path.split('?')[0] || '/'}`;
  const siteName = env.appName;
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  // Logo resmi (mobile/logo_prod.png) jadi fallback og:image
  const finalImage = image ?? `${env.appUrl}/logo.png`;
  const noindex = noindexAlways || !env.isProd;
  // Gambar kata → kartu besar; logo fallback tetap summary.
  const twitterCard = image ? 'summary_large_image' : 'summary';

  return [
    { title: fullTitle },
    { name: 'description', content: description },
    // Indexing hanya di produksi; staging/dev dan halaman pencarian noindex.
    ...(noindex
      ? [{ name: 'robots', content: 'noindex, nofollow' }]
      : [{ tagName: 'link', rel: 'canonical', href: canonical }]),
    // Open Graph
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:site_name', content: siteName },
    { property: 'og:locale', content: 'id_ID' },
    { property: 'og:type', content: type },
    { property: 'og:image', content: finalImage },
    // Twitter Card
    { name: 'twitter:card', content: twitterCard },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: finalImage },
  ];
}

const HOME_DESCRIPTION =
  'Kamus Sambas digital terbuka: cari kosakata Melayu Sambas, makna, terjemahan Indonesia, contoh kalimat, dan lafal. Jelajahi daftar A-Z atau kontribusi kata baru.';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.iamutaki.sambasku';
const GITHUB_URL = 'https://github.com/iamutaki/sambasku';

/**
 * Entitas situs untuk homepage (prod only).
 * "Kamus Sambas" = nama yang dicari; SambasKu = merek.
 * Sitelinks Google tidak dijamin - schema + struktur hanya membuat eligible.
 */
export function buildHomeJsonLd() {
  const websiteId = `${env.appUrl}/#website`;
  const organizationId = `${env.appUrl}/#organization`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': websiteId,
        name: 'Kamus Sambas',
        alternateName: [env.appName, 'Kamus Digital Sambas-Indonesia'],
        url: env.appUrl,
        description: HOME_DESCRIPTION,
        inLanguage: 'id',
        publisher: { '@id': organizationId },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${env.appUrl}/search?q={search_term_string}`,
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
    ?.map((t) => t.translation_text.trim())
    .filter(Boolean);
  return texts?.[0] ?? null;
}

/**
 * Title/description detail kata untuk query seperti "{lemma} bahasa sambas".
 * Contiguous "bahasa Sambas" di title + arti/terjemahan di description.
 */
export function buildWordSeoCopy(word: WordDetail): { title: string; description: string } {
  const lemma = word.lemma;
  const firstMeaning = word.meanings[0];
  const definition =
    firstMeaning?.definition?.trim() ||
    `makna dan penggunaan dalam bahasa Melayu Sambas`;
  const translation = firstIndonesianTranslation(word);

  const title = `${lemma} bahasa Sambas - arti & terjemahan`;

  const parts = [
    `Arti ${lemma} dalam bahasa Sambas: ${definition}`,
    translation ? `Terjemahan Indonesia: ${translation}.` : null,
    'Kamus Sambas.',
  ].filter(Boolean);

  return {
    title,
    description: truncateSeo(parts.join(' ')),
  };
}

/** FAQPage schema - hanya untuk konten FAQ asli di /faq (prod). */
export function buildFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: 'FAQ Kamus Sambas',
    url: `${env.appUrl}/faq`,
    inLanguage: 'id',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildWordJsonLd(word: WordDetail) {
  const { description } = buildWordSeoCopy(word);
  const translation = firstIndonesianTranslation(word);
  const primaryImage = word.images.find((img) => img.is_primary)?.url ?? word.images[0]?.url;
  const wordUrl = `${env.appUrl}/words/${encodeURIComponent(word.lemma)}`;
  const wordsIndexUrl = `${env.appUrl}/words`;

  const definedTerm = {
    '@type': 'DefinedTerm',
    '@id': `${wordUrl}#term`,
    name: word.lemma,
    alternateName: translation
      ? [`${word.lemma} bahasa Sambas`, translation]
      : [`${word.lemma} bahasa Sambas`],
    termCode: word.id,
    description,
    url: wordUrl,
    inLanguage: 'id',
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'Kamus Sambas',
      alternateName: [env.appName, 'Kamus Digital Sambas-Indonesia'],
      url: env.appUrl,
      inLanguage: 'id',
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
        name: 'Beranda',
        item: env.appUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Daftar Kata A-Z',
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
