import { useState, useSyncExternalStore, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Button,
  Card,
  Container,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { KeyRound, ArrowRight } from 'lucide-react';
import { resetPassword } from '../application/use-cases/auth.use-case';
import { buildMetaTags } from '../application/utils/seo';
import { formError } from '../application/utils/form-error';

export function meta() {
  return buildMetaTags({
    title: 'Atur password baru',
    description: 'Reset password akun SambasKu dengan kode atau tautan dari email.',
    path: '/reset-password',
    // Deeplink, bukan halaman kamus. Tanpa noindex, hreflang menunjuk
    // /{locale}/reset-password yang 404.
    noindexAlways: true,
  });
}

function extractToken(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    const url = trimmed.includes('://')
      ? new URL(trimmed)
      : new URL(trimmed, 'https://placeholder.local');
    const fromQuery = url.searchParams.get('token');
    if (fromQuery) return fromQuery;
  } catch {
    // bukan URL: anggap token mentah
  }
  return trimmed;
}

function subscribeHash(onStoreChange: () => void) {
  window.addEventListener('hashchange', onStoreChange);
  return () => window.removeEventListener('hashchange', onStoreChange);
}

function readHashToken() {
  return new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token') ?? '';
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Link email baru memakai fragment #token=... yang tidak pernah dikirim ke
  // server (bebas dari log akses/bookmark server-side). Fallback ?token=
  // untuk link email lama. Pentest W-07. Snapshot server kosong supaya
  // hidrasi cocok; nilai hash baru dibaca di client.
  const tokenFromQuery = searchParams.get('token') ?? '';
  const hashToken = useSyncExternalStore(subscribeHash, readHashToken, () => '');
  const tokenFromLink = hashToken || tokenFromQuery;
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const token = extractToken(tokenFromLink);
  const codeNormalized = code.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  const passwordOk =
    newPassword.length >= 8 && /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const canSubmit = token
    ? passwordOk && confirmPassword === newPassword && !submitting
    : email.includes('@') &&
      codeNormalized.length === 8 &&
      passwordOk &&
      confirmPassword === newPassword &&
      !submitting;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(
        token
          ? { token, newPassword }
          : { email, code: codeNormalized, newPassword },
      );
      setDone(true);
    } catch (err) {
      setError(formError(err, 'Gagal mereset password. Coba lagi.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container size="xs" py={48}>
      <Card withBorder padding="lg" radius="md" shadow="none">
        <Stack gap="xs" mb="md">
          <Title order={1} size="h3">
            {done ? 'Password berhasil direset' : 'Atur password baru'}
          </Title>
          <Text size="sm" c="dimmed">
            {done
              ? 'Silakan masuk lagi di aplikasi SambasKu dengan password baru.'
              : token
                ? 'Tautan cadangan. Buat password baru, sekali pakai.'
                : 'Masukkan kode 8 karakter 0-9A-Z dari email (berlaku 10 menit), lalu password baru.'}
          </Text>
        </Stack>

        {done ? (
          <Button
            fullWidth
            variant="light"
            leftSection={<ArrowRight size={16} />}
            onClick={() => navigate('/')}
          >
            Kembali ke beranda
          </Button>
        ) : (
          <form onSubmit={onSubmit}>
            <Stack gap="sm">
              {!tokenFromLink && (
                <>
                  <TextInput
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                  <TextInput
                    label="Kode Reset Password"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="01AB-23CD"
                    autoComplete="one-time-code"
                  />
                </>
              )}
              <PasswordInput
                label="Password baru"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter, huruf + angka"
                autoComplete="new-password"
              />
              <PasswordInput
                label="Konfirmasi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              {error && (
                <Text size="sm" c="red" role="alert">
                  {error}
                </Text>
              )}
              <Button
                type="submit"
                fullWidth
                disabled={!canSubmit}
                loading={submitting}
                leftSection={<KeyRound size={16} />}
              >
                Simpan password
              </Button>
            </Stack>
          </form>
        )}
      </Card>
    </Container>
  );
}
