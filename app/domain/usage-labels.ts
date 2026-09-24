/** Register + peringatan konten (closed enum, sinkron API usage_labels). */
export const USAGE_LABELS = [
  'kasar',
  'tabu',
  'informal',
  'halus',
  'seksual',
  'diskriminatif',
] as const;

export type UsageLabel = (typeof USAGE_LABELS)[number];

/** Register: gaya/pantangan berbahasa. */
export const REGISTER_LABELS = [
  'kasar',
  'tabu',
  'informal',
  'halus',
] as const satisfies readonly UsageLabel[];

/** Peringatan: sensitivitas isi makna. */
export const WARNING_LABELS = [
  'seksual',
  'diskriminatif',
] as const satisfies readonly UsageLabel[];

export const USAGE_LABEL_LABELS: Record<UsageLabel, string> = {
  kasar: 'Kasar',
  tabu: 'Tabu',
  informal: 'Informal',
  halus: 'Halus',
  seksual: 'Seksual',
  diskriminatif: 'Diskriminatif',
};

/** Label yang ditampilkan lebih menonjol (peringatan isi / register keras). */
export const PROMINENT_USAGE_LABELS = new Set<UsageLabel>([
  'kasar',
  'tabu',
  'seksual',
  'diskriminatif',
]);

export function label(code: string): string {
  return USAGE_LABEL_LABELS[code as UsageLabel] ?? code;
}

/** `halus` dan `kasar` saling bertentangan. */
export function hasConflictingUsageLabels(labels: readonly string[]): boolean {
  return labels.includes('halus') && labels.includes('kasar');
}
