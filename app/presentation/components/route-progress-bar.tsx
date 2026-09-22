import { useNavigation } from 'react-router';
import { Box, Transition } from '@mantine/core';

/**
 * Bar tipis di bawah header yang aktif selama navigasi/router loader jalan.
 * Feedback global untuk semua perpindahan halaman (SSR cepat, biasanya
 * hanya sekejap - tidak mengganggu).
 */
export function RouteProgressBar() {
  const navigation = useNavigation();
  const active = navigation.state !== 'idle';

  return (
    <Transition mounted={active} transition="slide-down" duration={200}>
      {(styles) => (
        <Box
          style={{
            ...styles,
            position: 'fixed',
            top: 60,
            left: 0,
            right: 0,
            height: 3,
            zIndex: 210,
            background:
              'linear-gradient(90deg, var(--mantine-primary-color-filled), var(--mantine-color-indigo-3))',
            transformOrigin: 'left',
          }}
        />
      )}
    </Transition>
  );
}
