import { Link } from 'react-router';
import {
  Accordion,
  Anchor,
  Container,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import type { Route } from './+types/faq';
import { FAQ_ITEMS } from '@/application/utils/faq-content';
import { buildFaqJsonLd, buildMetaTags } from '@/application/utils/seo';
import { env } from '@/infrastructure/config/env';

export function meta(_args: Route.MetaArgs) {
  return [
    ...buildMetaTags({
      title: 'FAQ - Tentang SambasKu',
      description:
        'Apa itu SambasKu dan Kamus Sambas, mengapa dibuat untuk pelestarian bahasa Melayu Sambas, cara kontribusi, status Terverifikasi, dan aplikasi Android.',
      path: '/faq',
    }),
    ...(env.isProd ? [{ 'script:ld+json': buildFaqJsonLd() }] : []),
  ];
}

export default function FaqPage() {
  return (
    <Container size="sm" py={44}>
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={1} fw={800}>
            FAQ
          </Title>
          <Text c="dimmed" size="md">
            Kamus Digital Terbuka Bahasa Sambas - pelestarian bahasa Melayu
            Sambas, akses terbuka, dan kontribusi komunitas. Jawaban disusun dari
            materi yang sudah ada di SambasKu; silakan ditinjau.
          </Text>
        </Stack>

        <Accordion variant="separated" radius="md" defaultValue={FAQ_ITEMS[0]?.question}>
          {FAQ_ITEMS.map((item) => (
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
          Siap menjelajah?{' '}
          <Anchor component={Link} to="/words">
            Buka daftar kata A-Z
          </Anchor>
          {' · '}
          <Anchor component={Link} to="/kontribusi">
            Ajukan kata baru
          </Anchor>
          {' · '}
          <Anchor component={Link} to="/">
            Kembali ke beranda
          </Anchor>
        </Text>
      </Stack>
    </Container>
  );
}
