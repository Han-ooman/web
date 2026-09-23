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

export async function listLanguages(signal?: AbortSignal): Promise<LanguageRef[]> {
  const res = await apiClient<LanguageRef[]>('/languages', { signal });
  return res.data.filter((l) => l.is_active);
}

export async function listWordClasses(signal?: AbortSignal): Promise<WordClassRef[]> {
  const res = await apiClient<WordClassRef[]>('/word-classes', { signal });
  return res.data;
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
