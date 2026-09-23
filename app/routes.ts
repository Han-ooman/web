import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('search', 'routes/search.tsx'),
  route('kontribusi', 'routes/kontribusi.tsx'),
  route('faq', 'routes/faq.tsx'),
  route('privacy-policy', 'routes/privacy-policy.tsx'),
  route('hapus-akun', 'routes/hapus-akun.tsx'),
  route('words', 'routes/words.tsx'),
  route('words/:lemma', 'routes/words.$lemma.tsx'),
  route('reset-password', 'routes/reset-password.tsx'),
  route('sitemap.xml', 'routes/sitemap[.]xml.ts'),
  route('robots.txt', 'routes/robots[.]txt.ts'),
] satisfies RouteConfig;
