import { Link } from 'react-router';
import {
  Anchor,
  Code,
  Container,
  List,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/api-publik';
import {
  API_PUBLIK_ATTRIBUTION,
  API_PUBLIK_BASE,
  API_PUBLIK_INTRO,
  API_PUBLIK_OUT_OF_SCOPE,
  API_PUBLIK_PRIMARY,
  API_PUBLIK_SECONDARY,
  API_PUBLIK_TOC,
  type ApiPublikEndpoint,
} from '@/application/utils/api-publik-content';
import { buildApiPublikJsonLd, buildMetaTags } from '@/application/utils/seo';
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
      title: t('seo_apiPublikTitle'),
      description: t('seo_apiPublikDescription'),
      path: localePath(locale, '/api-publik'),
      locale,
    }),
    ...(env.isProd
      ? [{ 'script:ld+json': buildApiPublikJsonLd(locale) }]
      : []),
  ];
}

function EndpointBlock({
  endpoint,
  primary,
}: {
  endpoint: ApiPublikEndpoint;
  primary: boolean;
}) {
  return (
    <Stack gap="sm" id={endpoint.id}>
      <Title order={primary ? 2 : 3} size={primary ? 'h4' : 'h5'} fw={700}>
        {endpoint.title}
      </Title>
      <Text size="sm" lh={1.7}>
        <Code>{endpoint.method}</Code> <Code>{endpoint.path}</Code>
      </Text>
      <Text size="sm" lh={1.75}>
        {endpoint.summary}
      </Text>
      {endpoint.params && endpoint.params.length > 0 ? (
        <List size="sm" spacing="xs" withPadding>
          {endpoint.params.map((p) => (
            <List.Item key={p.name}>
              <Text size="sm" lh={1.7} component="span">
                <Code>{p.name}</Code> - {p.detail}
              </Text>
            </List.Item>
          ))}
        </List>
      ) : null}
      {endpoint.notes?.map((note, i) => (
        <Text key={`${endpoint.id}-n-${i}`} size="sm" c="dimmed" lh={1.7}>
          {note}
        </Text>
      ))}
      <Stack gap={4}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          Contoh
        </Text>
        {endpoint.curls.map((curl) => (
          <Code key={curl} block>
            {curl}
          </Code>
        ))}
      </Stack>
      <Stack gap={4}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          Cuplikan respons
        </Text>
        <Code block>{endpoint.sampleJson}</Code>
      </Stack>
    </Stack>
  );
}

export default function ApiPublikPage() {
  const { t } = useTranslation();
  const lp = useLocalePath();

  return (
    <Container size="sm" py={44}>
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={1} fw={800}>
            {t('apiPublik_pageTitle')}
          </Title>
          <Text size="sm" c="dimmed">
            Base URL: <Code>{API_PUBLIK_BASE}</Code>
          </Text>
          {API_PUBLIK_INTRO.map((p, i) => (
            <Text key={`intro-${i}`} size="md" lh={1.7}>
              {p}
            </Text>
          ))}
          <Text size="sm" lh={1.75}>
            {API_PUBLIK_ATTRIBUTION}
          </Text>
        </Stack>

        <Stack gap="xs">
          <Title order={2} size="h5" fw={700}>
            {t('apiPublik_toc')}
          </Title>
          <List size="sm" spacing={4} withPadding>
            {API_PUBLIK_TOC.map((item) => (
              <List.Item key={item.id}>
                <Anchor href={`#${item.id}`} size="sm">
                  {item.label}
                </Anchor>
              </List.Item>
            ))}
          </List>
        </Stack>

        {API_PUBLIK_PRIMARY.map((endpoint) => (
          <EndpointBlock key={endpoint.id} endpoint={endpoint} primary />
        ))}

        <Stack gap="md">
          <Title order={2} size="h4" fw={700}>
            {t('apiPublik_alsoAvailable')}
          </Title>
          {API_PUBLIK_SECONDARY.map((endpoint) => (
            <EndpointBlock key={endpoint.id} endpoint={endpoint} primary={false} />
          ))}
        </Stack>

        <Text size="sm" c="dimmed" lh={1.7}>
          {API_PUBLIK_OUT_OF_SCOPE}
        </Text>

        <Text size="sm" c="dimmed">
          <Anchor component={Link} to={lp('/words')}>
            {t('nav_words')}
          </Anchor>
          {' · '}
          <Anchor component={Link} to={lp('/faq')}>
            {t('nav_faq')}
          </Anchor>
          {' · '}
          <Anchor href="/llms-full.txt" size="sm">
            llms-full.txt
          </Anchor>
          {' · '}
          <Anchor component={Link} to={lp('/')}>
            {t('common_backHome')}
          </Anchor>
        </Text>
      </Stack>
    </Container>
  );
}
