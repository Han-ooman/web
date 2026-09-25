/**
 * URL tampilan gambar: bungkus jsDelivr dengan wsrv.nl untuk resize.
 * URL ImageKit / lain dikembalikan apa adanya.
 *
 * Skema selain https: ditolak (undefined) - data gambar datang dari API
 * yang sebagian isinya kontribusi user (pentest W-10).
 */
export function displayImageUrl(
  url: string | null | undefined,
  opts: { width?: number; height?: number } = {},
): string | undefined {
  if (!url) return undefined;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return undefined;
  }
  if (u.protocol !== 'https:') return undefined;

  const isJsDelivr =
    u.hostname === 'cdn.jsdelivr.net' || u.hostname.endsWith('.jsdelivr.net');
  if (!isJsDelivr) return url;

  const params = new URLSearchParams();
  params.set('url', `${u.host}${u.pathname}${u.search}`);
  if (opts.width) params.set('w', String(opts.width));
  if (opts.height) params.set('h', String(opts.height));
  params.set('fit', 'cover');
  params.set('output', 'webp');
  return `https://wsrv.nl/?${params.toString()}`;
}
