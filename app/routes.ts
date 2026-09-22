import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('search', 'routes/search.tsx'),
  route('words', 'routes/words.tsx'),
  route('words/:id', 'routes/words.$id.tsx'),
  route('reset-password', 'routes/reset-password.tsx'),
  route('sitemap.xml', 'routes/sitemap[.]xml.ts'),
  route('robots.txt', 'routes/robots[.]txt.ts'),
] satisfies RouteConfig;
