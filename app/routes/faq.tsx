import { Link } from 'react-router';
import {
  Accordion,
  Anchor,
  Container,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/faq';
import { buildFaqJsonLd, buildMetaTags } from '@/application/utils/seo';
import { env } from '@/infrastructure/config/env';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { useLocalePath } from '@/application/i18n/use-locale';

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  return [
    ...buildMetaTags({
      title: t('seo_faqTitle'),
      description: t('seo_faqDescription'),
      path: localePath(locale, '/faq'),
      locale,
    }),
    ...(env.isProd ? [{ 'script:ld+json': buildFaqJsonLd(locale) }] : []),
  ];
}

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqPage() {
  const { t } = useTranslation();
  const lp = useLocalePath();
  const items = t('faq_items', { returnObjects: true }) as FaqItem[];
  const list = Array.isArray(items) ? items : [];

  return (
    <Container size="sm" py={44}>
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={1} fw={800}>
            {t('faq_pageTitle')}
          </Title>
          <Text c="dimmed" size="md">
            {t('faq_intro')}
          </Text>
        </Stack>

        <Accordion
          variant="separated"
          radius="md"
          defaultValue={list[0]?.question}
        >
          {list.map((item) => (
            <Accordion.Item key={item.question} value={item.question}>
              <Accordion.Control>{item.question}</Accordion.Control>
              <Accordion.Panel>
                <Text size="sm" lh={1.7}>
                  {item.answer}
                </Text>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>

        <Text size="sm" c="dimmed">
          {t('faq_footerReady')}{' '}
          <Anchor component={Link} to={lp('/words')}>
            {t('faq_footerWords')}
          </Anchor>
          {' · '}
          <Anchor component={Link} to={lp('/kontribusi')}>
            {t('faq_footerContribute')}
          </Anchor>
          {' · '}
          <Anchor component={Link} to={lp('/')}>
            {t('faq_footerHome')}
          </Anchor>
        </Text>
      </Stack>
    </Container>
  );
}
