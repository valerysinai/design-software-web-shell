/**
 * `RemoteUnavailable` del shell — ahora envuelve el Web Component del design-system.
 *
 * Antes (HU-SHELL-002) era un placeholder local en CSS Modules. Este wrapper
 * conserva la API de React y traduce el evento `sena-retry` del Custom Element a
 * la prop `onRetry`.
 *
 * POR QUE UN REF Y NO `onSenaRetry={...}`:
 * React solo adjunta listeners para eventos que existen en su catalogo
 * (`onClick`, `onChange`...). Para un Custom Element, cualquier otro evento hay
 * que registrarlo a mano con `addEventListener`. Si se pasa `onSenaRetry` como
 * prop, React la ignora en silencio y el reintento nunca llega: el bug que
 * atrapa este test.
 */
import { useCallback, useEffect, useRef } from 'react';

import type { RemoteUnavailable as RemoteUnavailableElement } from '@sena/design-system/components';

import '../design-system/register';

export interface RemoteUnavailableProps {
  domain: string;
  reason?: string;
  onRetry?: () => void;
}

/** E1 (ADR-009 §8): pantalla de error de un remote. */
export const RemoteUnavailable = ({ domain, reason, onRetry }: RemoteUnavailableProps) => {
  const ref = useRef<RemoteUnavailableElement>(null);

  const handleRetry = useCallback(() => {
    onRetry?.();
  }, [onRetry]);

  // `sena-retry` sale del shadow DOM porque el componente lo emite con
  // `composed: true`; el listener va en el host.
  useEffect(() => {
    const element = ref.current;
    if (element === null || onRetry === undefined) return undefined;

    element.addEventListener('sena-retry', handleRetry);
    return () => element.removeEventListener('sena-retry', handleRetry);
  }, [handleRetry, onRetry]);

  return (
    <sena-remote-unavailable
      ref={ref}
      domain={domain}
      {...(reason === undefined ? {} : { reason })}
    />
  );
};