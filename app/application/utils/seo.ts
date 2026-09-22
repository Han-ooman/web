import type { WordDetail } from '@/domain/entities/word.entity';
import { env } from '@/infrastructure/config/env';

export interface SeoMetaProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
}

export function buildMetaTags({
  title,
  description,
  path = '',
  image,
  type = 'website',
}: SeoMetaProps) {
  const url = `${env.appUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const siteName = env.appName;
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  return [
    { title: fullTitle },
    { name: 'description', content: description },
    // Open Graph
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:site_name', content: siteName },
    { property: 'og:type', content: type },
    ...(image ? [{ property: 'og:image', content: image }] : []),
    // Twitter Card
    { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: description },
    ...(image ? [{ name: 'twitter:image', content: image }] : []),
  ];
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
      name: env.appName,
      url: env.appUrl,
    },
    ...(primaryImage ? { image: primaryImage } : {}),
  };
}
