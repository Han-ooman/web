import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import {
  Anchor,
  Button,
  Card,
  Container,
  List,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import type { Route } from './+types/hapus-akun';
import { AppError } from '@/infrastructure/api/api-client';
import {
  confirmAccountDeletion,
  requestAccountDeletion,
} from '@/application/use-cases/auth.use-case';
import { buildMetaTags } from '@/application/utils/seo';

export function meta(_args: Route.MetaArgs) {
  return buildMetaTags({
    title: 'Hapus akun SambasKu',
    description:
      'Cara menghapus akun SambasKu dan data pribadi lewat aplikasi Android atau situs, termasuk data yang dihapus dan yang tetap tersimpan.',
    path: '/hapus-akun',
  });
}

export default function HapusAkunPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const codeNormalized = code.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  const canRequest = email.includes('@') && !submitting;
  const canConfirm =
    email.includes('@') &&
    codeNormalized.length === 8 &&
    confirmation === 'HAPUS' &&
    !submitting;

  async function onRequest(event: FormEvent) {
    event.preventDefault();
    if (!canRequest) return;
    setSubmitting(true);
    setError(null);
    try {
      await requestAccountDeletion(email.trim());
      setCodeSent(true);
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Gagal mengirim kode. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onConfirm(event: FormEvent) {
    event.preventDefault();
    if (!canConfirm) return;
    setSubmitting(true);
    setError(null);
    try {
      await confirmAccountDeletion({
        email: email.trim(),
        code: codeNormalized,
        confirmation,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Gagal menghapus akun. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container size="sm" py={44}>
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={1} fw={800}>
            Hapus akun SambasKu
          </Title>
          <Text size="md" lh={1.7}>
            SambasKu menyediakan cara menghapus akun dan data pribadi yang terikat
            padanya, baik dari aplikasi Android maupun dari situs ini tanpa harus
            membuka aplikasi.
          </Text>
        </Stack>

        <Stack gap="sm">
          <Title order={2} size="h4">
            Lewat aplikasi Android
          </Title>
          <List size="sm" spacing="xs">
            <List.Item>Masuk ke akun SambasKu.</List.Item>
            <List.Item>Buka tab Profil.</List.Item>
            <List.Item>Pilih Hapus akun.</List.Item>
            <List.Item>
              Ketik HAPUS. Jika akun memakai email dan kata sandi, isi kata sandi.
            </List.Item>
            <List.Item>Akun langsung dihapus dan kamu keluar dari aplikasi.</List.Item>
          </List>
        </Stack>

        <Stack gap="sm">
          <Title order={2} size="h4">
            Lewat situs ini
          </Title>
          <Text size="sm" lh={1.7}>
            Masukkan email akun. Kami kirim kode 8 karakter yang berlaku 10 menit.
            Tidak ada masa tunggu tambahan: akun terhapus begitu kode dan konfirmasi
            HAPUS diterima.
          </Text>

          {done ? (
            <Card withBorder padding="lg" radius="md">
              <Text size="sm">
                Akun dan data pribadi berhasil dihapus. Entri kamus yang sudah tayang
                tetap ada tanpa nama akun.
              </Text>
            </Card>
          ) : (
            <Card withBorder padding="lg" radius="md">
              <form onSubmit={codeSent ? onConfirm : onRequest}>
                <Stack gap="sm">
                  <TextInput
                    label="Email akun"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.currentTarget.value)}
                    disabled={submitting || codeSent}
                    required
                  />
                  {codeSent ? (
                    <>
                      <Text size="sm" c="dimmed">
                        Jika email terdaftar, kode sudah dikirim. Masukkan kode lalu
                        ketik HAPUS.
                      </Text>
                      <TextInput
                        label="Kode dari email"
                        value={code}
                        onChange={(event) => setCode(event.currentTarget.value)}
                        disabled={submitting}
                        autoCapitalize="characters"
                      />
                      <TextInput
                        label="Ketik HAPUS untuk mengonfirmasi"
                        value={confirmation}
                        onChange={(event) => setConfirmation(event.currentTarget.value)}
                        disabled={submitting}
                      />
                    </>
                  ) : null}
                  {error ? (
                    <Text size="sm" c="red">
                      {error}
                    </Text>
                  ) : null}
                  <Button type="submit" loading={submitting} disabled={codeSent ? !canConfirm : !canRequest}>
                    {codeSent ? 'Hapus akun' : 'Kirim kode'}
                  </Button>
                  {codeSent ? (
                    <Button
                      variant="subtle"
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        setCodeSent(false);
                        setCode('');
                        setConfirmation('');
                        setError(null);
                      }}
                    >
                      Ganti email
                    </Button>
                  ) : null}
                </Stack>
              </form>
            </Card>
          )}
        </Stack>

        <Stack gap="sm">
          <Title order={2} size="h4">
            Data yang dihapus
          </Title>
          <List size="sm" spacing="xs">
            <List.Item>Nama, email, nomor HP, kata sandi, dan foto profil.</List.Item>
            <List.Item>Sesi masuk, token notifikasi, bookmark, dan notifikasi dalam aplikasi.</List.Item>
            <List.Item>Tautan masuk dengan Google atau Facebook.</List.Item>
            <List.Item>Data pribadi pada pengajuan verifikator dan laporan bug.</List.Item>
          </List>
        </Stack>

        <Stack gap="sm">
          <Title order={2} size="h4">
            Data yang tetap ada
          </Title>
          <Text size="sm" lh={1.7}>
            Entri kamus, komentar, dan kontribusi yang sudah dipublikasikan tetap
            tersimpan karena menjadi bagian kamus bersama. Nama akun pada konten itu
            diganti menjadi penanda pengguna yang dihapus. Log teknis server untuk
            keamanan disimpan dalam jangka waktu wajar, tanpa dipakai untuk
            mengidentifikasi akun yang sudah dihapus.
          </Text>
        </Stack>

        <Text size="sm" c="dimmed">
          <Anchor component={Link} to="/privacy-policy">
            Kebijakan Privasi
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
