import { Link, useLoaderData } from 'react-router';
import {
  Anchor,
  Avatar,
  Badge,
  Card,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { UserRound } from 'lucide-react';
import type { Route } from './+types/users.$username';
import { getPublicProfile } from '@/application/use-cases/user.use-case';
import { buildMetaTags } from '@/application/utils/seo';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { useLocalePath } from '@/application/i18n/use-locale';

import { env } from '@/infrastructure/config/env';
import { displayImageUrl } from '@/presentation/utils/display-image-url';

export function meta({ data, params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const username = data?.profile?.username ?? data?.username ?? 'pengguna';
  const display = data?.profile?.display_name ?? username;
  return buildMetaTags({
    title: `${display} di SambasKu`,
    description: `Profil publik ${display} di kamus digital bahasa Sambas.`,
    path: localePath(locale, `/users/${encodeURIComponent(username)}`),
    locale,
    // Thin UGC, tidak di sitemap - jangan diindeks.
    noindexAlways: true,
  });
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const username = params.username?.trim();
  if (!username) {
    throw new Response('Username tidak valid', { status: 400 });
  }

  try {
    const profile = await getPublicProfile(username, request.signal);
    return { profile, username: profile.username };
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode ?? 404;
    if (status === 404) {
      return { profile: null, username };
    }
    throw new Response('Gagal memuat profil', { status });
  }
}

export default function PublicProfilePage() {
  const lp = useLocalePath();

  const { profile, username } = useLoaderData<typeof loader>();
  const deepLink = `sambasku://app/users/${encodeURIComponent(username)}`;
  const httpsLink = `${env.appUrl}${lp(`/users/${encodeURIComponent(username)}`)}`;

  if (!profile) {
    return (
      <Container size="sm" py={44}>
        <Stack gap="md">
          <Title order={1} fw={800}>
            Profil tidak ditemukan
          </Title>
          <Text c="dimmed">
            Pengguna @{username} tidak ada atau sudah dihapus.
          </Text>
          <Anchor component={Link} to={lp('/')}>
            Kembali ke beranda
          </Anchor>
        </Stack>
      </Container>
    );
  }

  const avatarSrc = displayImageUrl(profile.avatar_url, { width: 160 });

  return (
    <Container size="sm" py={44}>
      <Stack gap="xl">
        <Group gap="md" align="flex-start">
          <Avatar src={avatarSrc} radius="xl" size={72} color="teal">
            <UserRound size={28} />
          </Avatar>
          <Stack gap={4} style={{ flex: 1 }}>
            <Group gap="xs">
              <Title order={1} fw={800} size="h2">
                {profile.display_name}
              </Title>
              {profile.is_verifier ? (
                <Badge color="teal" variant="light">
                  Verifikator
                </Badge>
              ) : null}
            </Group>
            <Text c="dimmed" size="sm">
              @{profile.username}
            </Text>
            {profile.bio ? <Text size="sm">{profile.bio}</Text> : null}
          </Stack>
        </Group>

        <Card withBorder padding="md" radius="md">
          <Group grow>
            <Stack gap={2} align="center">
              <Text fw={700}>{profile.stats.contributions_approved}</Text>
              <Text size="xs" c="dimmed" ta="center">
                Kontribusi
              </Text>
            </Stack>
            <Stack gap={2} align="center">
              <Text fw={700}>{profile.stats.verifications_done}</Text>
              <Text size="xs" c="dimmed" ta="center">
                Verifikasi
              </Text>
            </Stack>
            <Stack gap={2} align="center">
              <Text fw={700}>{profile.stats.comments_published}</Text>
              <Text size="xs" c="dimmed" ta="center">
                Komentar
              </Text>
            </Stack>
          </Group>
        </Card>

        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            Buka profil ini di aplikasi SambasKu untuk fitur lengkap.
          </Text>
          <Anchor href={deepLink}>Buka di aplikasi</Anchor>
          <Text size="xs" c="dimmed">
            Atau salin tautan: {httpsLink}
          </Text>
        </Stack>

        <Anchor component={Link} to={lp('/')}>
          Kembali ke beranda
        </Anchor>
      </Stack>
    </Container>
  );
}
