import { Link } from 'react-router';
import {
  Anchor,
  Container,
  List,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import type { Route } from './+types/privacy-policy';
import {
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_INTRO,
  PRIVACY_LAST_UPDATED,
  PRIVACY_SECTIONS,
} from '@/application/utils/privacy-policy-content';
import { buildMetaTags } from '@/application/utils/seo';

export function meta(_args: Route.MetaArgs) {
  return buildMetaTags({
    title: 'Kebijakan Privasi',
    description:
      'Kebijakan Privasi SambasKu: data akun, kontribusi, notifikasi, analitik Firebase, dan layanan pihak ketiga pada aplikasi Android serta situs kamus Sambas.',
    path: '/privacy-policy',
  });
}

export default function PrivacyPolicyPage() {
  return (
    <Container size="sm" py={44}>
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={1} fw={800}>
            Kebijakan Privasi
          </Title>
          <Text c="dimmed" size="sm">
            Berlaku efektif: {PRIVACY_EFFECTIVE_DATE}
            {' · '}
            Terakhir diperbarui: {PRIVACY_LAST_UPDATED}
          </Text>
          {PRIVACY_INTRO.map((p, i) => (
            <Text key={`intro-${i}`} size="md" lh={1.7}>
              {p}
            </Text>
          ))}
        </Stack>

        {PRIVACY_SECTIONS.map((section) => (
          <Stack key={section.id} gap="sm" id={section.id}>
            <Title order={2} size="h4" fw={700}>
              {section.title}
            </Title>
            {section.paragraphs.map((p, i) => (
              <Text key={`${section.id}-p-${i}`} size="sm" lh={1.75}>
                {p}
              </Text>
            ))}
            {section.bullets && section.bullets.length > 0 ? (
              <List size="sm" spacing="xs" withPadding>
                {section.bullets.map((item, i) => (
                  <List.Item key={`${section.id}-b-${i}`}>
                    <Text size="sm" lh={1.7} component="span">
                      {item}
                    </Text>
                  </List.Item>
                ))}
              </List>
            ) : null}
          </Stack>
        ))}

        <Text size="sm" c="dimmed">
          <Anchor component={Link} to="/hapus-akun">
            Hapus akun
          </Anchor>
          {' · '}
          <Anchor component={Link} to="/faq">
            FAQ
          </Anchor>
          {' · '}
          <Anchor component={Link} to="/">
            Beranda
          </Anchor>
        </Text>
      </Stack>
    </Container>
  );
}
