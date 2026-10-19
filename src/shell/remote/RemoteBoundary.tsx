import { Suspense, type ReactNode } from 'react';

import { LoadingRemote } from '../components/LoadingRemote/LoadingRemote';
import { RemoteUnavailable } from '../components/RemoteUnavailable/RemoteUnavailable';
import { RemoteErrorBoundary } from './RemoteErrorBoundary';

export interface RemoteBoundaryProps {
  domain: string;
  children: ReactNode;
  /** Cambia cuando el usuario navega, para reintentar la carga del remote. */
  resetKey?: string;
  onError?: (error: Error) => void;
}

/**
 * E1 (ADR-009 §8): todo remote se monta envuelto en Suspense **y** ErrorBoundary.
 * Nunca uno solo de los dos: sin Suspense no hay feedback de carga y sin ErrorBoundary
 * un remote caido desmonta el shell completo.
 */
export const RemoteBoundary = ({ domain, children, resetKey, onError }: RemoteBoundaryProps) => (
  <RemoteErrorBoundary
    resetKey={resetKey}
    onError={onError === undefined ? undefined : (error) => onError(error)}
    fallback={(error, retry) => (
      <RemoteUnavailable domain={domain} reason={error.message} onRetry={retry} />
    )}
  >
    <Suspense fallback={<LoadingRemote domain={domain} />}>{children}</Suspense>
  </RemoteErrorBoundary>
);