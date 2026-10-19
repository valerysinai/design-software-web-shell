import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';

import { OfflineBanner } from './OfflineBanner';
import { useOnlineStatus } from '../../hooks/use-online-status';

const Probe = () => {
  const isOnline = useOnlineStatus();
  return <>{isOnline ? null : <OfflineBanner />}</>;
};

const setOnline = (value: boolean): void => {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value });
  act(() => {
    window.dispatchEvent(new Event(value ? 'online' : 'offline'));
  });
};

describe('E4 estado offline', () => {
  it('no muestra el banner con conexion', () => {
    setOnline(true);
    render(<Probe />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('muestra el banner cuando se pierde la conexion', () => {
    setOnline(false);
    render(<Probe />);

    expect(screen.getByRole('status')).toHaveTextContent(/Sin conexión/i);
  });

  it('reaparece el contenido cuando vuelve la conexion', () => {
    setOnline(false);
    render(<Probe />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    setOnline(true);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('el banner dice que se muestran datos guardados', () => {
    render(<OfflineBanner />);

    expect(screen.getByText(/datos guardados/i)).toBeInTheDocument();
  });
});