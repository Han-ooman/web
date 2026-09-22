import type { WordType } from '@/domain/entities/word.entity';

const MONTH_NAMES_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export function formatDateId(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const month = MONTH_NAMES_ID[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

export function formatWordType(type: WordType): string {
  switch (type) {
    case 'word':
      return 'Kata';
    case 'idiom':
      return 'Idiom';
    case 'peribahasa':
      return 'Peribahasa';
    case 'ungkapan':
      return 'Ungkapan';
    default:
      return type;
  }
}

export function formatWordClass(code?: string | null, name?: string | null): string {
  if (!code && !name) return '-';
  if (code && name) return `${code} (${name})`;
  return code ?? name ?? '-';
}
