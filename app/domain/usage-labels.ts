/** Gaya bahasa + peringatan konten (closed enum, sinkron API usage_labels). */
export const USAGE_LABELS = [
  'kasar',
  'tabu',
  'informal',
  'halus',
  'seksual',
  'diskriminatif',
] as const;

export type UsageLabel = (typeof USAGE_LABELS)[number];

/** Gaya bahasa: pantangan / tingkat tutur. */
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

/** Label yang ditampilkan lebih menonjol (peringatan isi / gaya keras). */
export const PROMINENT_USAGE_LABELS = new Set<UsageLabel>([
  'kasar',
  'tabu',
  'seksual',
  'diskriminatif',
]);

/**
 * Label yang disembunyikan dari browsing A-Z publik (GET /words tanpa q).
 * Sinkron API `BROWSE_EXCLUDED_USAGE_LABELS` - filter di server, bukan client.
 */
export const BROWSE_EXCLUDED_USAGE_LABELS = [
  'kasar',
  'diskriminatif',
] as const satisfies readonly UsageLabel[];

export function label(code: string): string {
  return USAGE_LABEL_LABELS[code as UsageLabel] ?? code;
}

/** `halus` dan `kasar` saling bertentangan. */
export function hasConflictingUsageLabels(labels: readonly string[]): boolean {
  return labels.includes('halus') && labels.includes('kasar');
}
