/**
 * `LoadingRemote` del shell — ahora envuelve el Web Component del design-system.
 *
 * Antes (HU-SHELL-002) era un placeholder local en CSS Modules, con el comentario
 * "ADR-009 §8 indica que el componente definitivo vive en design-system
 * (HU-SHELL-006)". Ese componente ya existe, asi que aqui solo queda el envio de
 * props de React al Custom Element.
 *
 * Se mantiene la misma API (`<LoadingRemote domain="iam" />`) para no tocar los
 * 6 call sites de `RemoteBoundary`, `RemoteRoutes` y `main.tsx`.
 */
import '../design-system/register';

export interface LoadingRemoteProps {
  domain: string;
  /** Sobrescribe el texto por defecto ("Cargando <domain>"). */
  label?: string;
}

/** E2 (ADR-009 §8): estado de carga de un remote. */
export const LoadingRemote = ({ domain, label }: LoadingRemoteProps) => (
  <sena-loading-remote domain={domain} {...(label === undefined ? {} : { label })} />
);