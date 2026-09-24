import { redirect, type LoaderFunctionArgs } from 'react-router';
import { DEFAULT_LOCALE, localePath } from '@/application/i18n/locales';
import { env } from '@/infrastructure/config/env';

/**
 * Path lama tanpa prefix locale → `/{defaultLocale}{path}{search}`.
 * Dipakai bersama untuk /words, /search, /faq, dll.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const target = localePath(DEFAULT_LOCALE, url.pathname, url.search);
  throw redirect(target, env.isProd ? 301 : 302);
}

export default function LegacyRedirect() {
  return null;
}
