import { apiClient } from '@/infrastructure/api/api-client';

export interface LanguageRef {
  id: string;
  code: string;
  name: string;
  native_name: string | null;
  is_active: boolean;
}

export interface WordClassRef {
  id: string;
  code: string;
  name: string;
  alias: string | null;
}

export interface DialectRef {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
}

export async function listLanguages(signal?: AbortSignal): Promise<LanguageRef[]> {
  const res = await apiClient<LanguageRef[]>('/languages', { signal });
  return res.data.filter((l) => l.is_active);
}

export async function listWordClasses(signal?: AbortSignal): Promise<WordClassRef[]> {
  const res = await apiClient<WordClassRef[]>('/word-classes', { signal });
  return res.data;
}

export async function listDialects(languageId: string, signal?: AbortSignal): Promise<DialectRef[]> {
  const query = new URLSearchParams({ language_id: languageId });
  const res = await apiClient<DialectRef[]>(`/dialects?${query.toString()}`, { signal });
  return res.data.filter((d) => d.is_active);
}

/** Kelas kata code `umum` - fallback saat kontributor belum tahu kelasnya. */
export function pickUmumWordClassId(wordClasses: { id: string; code: string }[]): string {
  return wordClasses.find((w) => w.code.trim().toLowerCase() === 'umum')?.id ?? '';
}

/** Dialek form: `is_default`, fallback code `umum`. */
export function pickDefaultDialectId(dialects: DialectRef[]): string | undefined {
  return (
    dialects.find((d) => d.is_default)?.id ??
    dialects.find((d) => d.code.trim().toLowerCase() === 'umum')?.id
  );
}

/** Bahasa Sambas = bahasa aktif yang bukan Indonesia (kode bebas: SBS/smb). */
export function pickSambasLanguage(langs: LanguageRef[]): LanguageRef | undefined {
  const isIndonesian = (code: string) => ['id', 'idn', 'ind'].includes(code.toLowerCase());
  return langs.find((l) => !isIndonesian(l.code)) ?? langs[0];
}

export function pickIndonesianLanguage(langs: LanguageRef[]): LanguageRef | undefined {
  const isIndonesian = (code: string) => ['id', 'idn', 'ind'].includes(code.toLowerCase());
  return langs.find((l) => isIndonesian(l.code));
}
