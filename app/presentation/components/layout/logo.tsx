import { Image, useComputedColorScheme } from '@mantine/core';

interface LogoProps {
  h: number;
  /** Logo di atas lipatan (header): prioritaskan fetch, tanpa lazy. */
  eager?: boolean;
}

export function Logo({ h, eager }: LogoProps) {
  const colorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  });

  return (
    <Image
      src={colorScheme === 'dark' ? '/logo_hor_dark.png' : '/logo_hor_light.png'}
      alt="SambasKu"
      h={h}
      w="auto"
      fit="contain"
      decoding="async"
      // ponytail: fetchPriority React 19; ganti ke loading=lazy saja kalau
      // turun versi React.
      {...(eager ? { fetchPriority: 'high' as const } : { loading: 'lazy' })}
    />
  );
}
