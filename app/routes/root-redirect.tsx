import { redirect } from 'react-router';
import type { Route } from './+types/root-redirect';
import { localePath } from '@/application/i18n/locales';
import { resolvePreferredLocale } from '@/application/i18n/resolve-preferred-locale';
import { env } from '@/infrastructure/config/env';

/** `/` → `/{locale}` (301 prod, 302 selainnya). */
export async function loader({ request }: Route.LoaderArgs) {
  const locale = resolvePreferredLocale(request);
  const status = env.isProd ? 301 : 302;
  throw redirect(localePath(locale, '/'), status);
}

export default function RootRedirect() {
  return null;
}
