import { type RouteConfig, index, route } from '@react-router/dev/routes';

/**
 * Rute ber-locale di bawah `/:locale/*`.
 * Path legacy tanpa prefix diarahkan ke default locale (legacy-redirect).
 * Deeplink `/reset-password` + sitemap/robots tetap tanpa prefix (bukan SEO chrome).
 */
export default [
  index('routes/root-redirect.tsx'),
  route('sitemap.xml', 'routes/sitemap[.]xml.ts'),
  route('sitemap-static.xml', 'routes/sitemap-static[.]xml.ts'),
  route('sitemap-words/:letter', 'routes/sitemap-words.$letter.ts'),
  // Kartu OG per kata: di luar pohon locale (segmen statis 'og' menang
  // dari :locale dalam ranking route).
  route('og/words/:lemma', 'routes/og.words[.]png.ts'),
  route('robots.txt', 'routes/robots[.]txt.ts'),
  route('rss.xml', 'routes/rss[.]xml.ts'),
  route('reset-password', 'routes/reset-password.tsx'),

  // Legacy tanpa locale → 301/302 ke /{defaultLocale}/...
  route('search', 'routes/legacy-redirect.tsx', { id: 'legacy-search' }),
  route('kontribusi', 'routes/legacy-redirect.tsx', { id: 'legacy-kontribusi' }),
  route('bantuan-terjemahan', 'routes/legacy-redirect.tsx', {
    id: 'legacy-bantuan',
  }),
  route('bantuan-terjemahan/:id', 'routes/legacy-redirect.tsx', {
    id: 'legacy-bantuan-id',
  }),
  route('faq', 'routes/legacy-redirect.tsx', { id: 'legacy-faq' }),
  route('privacy-policy', 'routes/legacy-redirect.tsx', { id: 'legacy-privacy' }),
  route('hapus-akun', 'routes/legacy-redirect.tsx', { id: 'legacy-hapus' }),
  route('words', 'routes/legacy-redirect.tsx', { id: 'legacy-words' }),
  route('words/:lemma', 'routes/legacy-redirect.tsx', { id: 'legacy-words-lemma' }),
  route('users/:username', 'routes/legacy-redirect.tsx', { id: 'legacy-users' }),

  route(':locale', 'routes/locale-layout.tsx', [
    index('routes/home.tsx'),
    route('search', 'routes/search.tsx'),
    route('kontribusi', 'routes/kontribusi.tsx'),
    route('bantuan-terjemahan', 'routes/bantuan-terjemahan.tsx'),
    route('bantuan-terjemahan/:id', 'routes/bantuan-terjemahan.$id.tsx'),
    route('faq', 'routes/faq.tsx'),
    route('privacy-policy', 'routes/privacy-policy.tsx'),
    route('hapus-akun', 'routes/hapus-akun.tsx'),
    route('words', 'routes/words.tsx'),
    route('words/:lemma', 'routes/words.$lemma.tsx'),
    route('huruf/:letter', 'routes/huruf.$letter.tsx'),
    route('users/:username', 'routes/users.$username.tsx'),
  ]),
] satisfies RouteConfig;
