import type { WordDetail } from '@/domain/entities/word.entity';
import { env } from '@/infrastructure/config/env';

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
    { property: 'og:type', content: type },
    { property: 'og:image', content: finalImage },
    // Twitter Card
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: finalImage },
  ];
}

/** Entitas situs: "Kamus Sambas" adalah nama yang dicari, SambasKu nama merek. */
export function buildHomeJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Kamus Sambas',
    alternateName: [env.appName, 'Kamus Digital Sambas-Indonesia'],
    url: env.appUrl,
    description:
      'Kamus Sambas adalah kamus digital bahasa Melayu Sambas dan Indonesia untuk kosakata, makna, terjemahan, dan peribahasa.',
  };
}

export function buildWordJsonLd(word: WordDetail) {
  const firstMeaning = word.meanings[0];
  const definition = firstMeaning?.definition ?? `Arti kata ${word.lemma} dalam bahasa Sambas`;
  const primaryImage = word.images.find((img) => img.is_primary)?.url ?? word.images[0]?.url;

  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: word.lemma,
    termCode: word.id,
    description: definition,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'Kamus Sambas',
      alternateName: env.appName,
      url: env.appUrl,
    },
    ...(primaryImage ? { image: primaryImage } : {}),
  };
}
