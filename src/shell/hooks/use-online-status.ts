import { useEffect, useState } from 'react';

/**
 * E4: sigue la conectividad del navegador.
 *
 * `navigator.onLine` es una pista, no una garantia: puede reportar online con la red caida
 * y offline con un captive portal. Por eso solo governs el banner; cada remote sigue
 * manejando su propio error de carga (E3 de `HU-SHELL-002`).
 *
 * El valor inicial lee `navigator.onLine` para no parpadear en el primer render.
 */
export const useOnlineStatus = (): boolean => {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOnline = (): void => setIsOnline(true);
    const goOffline = (): void => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
};