import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import type { SessionDataSource } from '../../app/data-source/session-data-source';
import { redirectToLogin } from './redirect-to-login';

export interface RequireSessionProps {
  dataSource: SessionDataSource;
  children: ReactNode;
}

/**
 * E3 (ADR-009 §10): guard de sesion sobre el router compartido.
 *
 * Sin sesion valida, redirige al login de `iamMfe` **preservando la ruta de retorno**
 * en `state.from`, para que `iamMfe` pueda devolver al usuario a donde estaba.
 *
 * Este guard reemplaza al `redirectToLogin` provisional de `HU-SHELL-001`, que solo
 * mostraba un texto estatico en vez de navegar.
 */
export const RequireSession = ({ dataSource, children }: RequireSessionProps) => {
  const { pathname, search } = useLocation();

  // `redirectToLogin` devuelve la ruta actual cuando hay sesion, y `/login` cuando no.
  const target = redirectToLogin(dataSource, pathname);

  if (target === pathname) {
    return <>{children}</>;
  }

  return <Navigate to={target} replace state={{ from: `${pathname}${search}` }} />;
};