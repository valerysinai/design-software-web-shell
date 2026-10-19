import { useCallback, useEffect, useState } from 'react';
import type { Me } from '@sena/frontend-platform';

import type { SessionDataSource } from '../data-source/session-data-source';

export type CurrentUserState =
  | { status: 'loading'; user: null; error: null }
  | { status: 'authenticated'; user: Me; error: null }
  | { status: 'unauthenticated'; user: null; error: null }
  | { status: 'error'; user: null; error: string };

export interface UseCurrentUserResult {
  state: CurrentUserState;
  reload: () => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * E2: envuelve la lectura de la sesion a traves de `SessionDataSource`.
 * El hook no conoce el endpoint ni si la fuente es mock o HTTP.
 * E3: sin sesion resuelta el estado queda `unauthenticated` y el guard del shell
 * redirige al login de `iamMfe` en lugar de renderizar un shell vacio.
 */
export const useCurrentUser = (dataSource: SessionDataSource): UseCurrentUserResult => {
  const [state, setState] = useState<CurrentUserState>({ status: 'loading', user: null, error: null });

  const load = useCallback(async (): Promise<void> => {
    if (!dataSource.hasSession()) {
      setState({ status: 'unauthenticated', user: null, error: null });
      return;
    }
    try {
      const user = await dataSource.getMe();
      setState({ status: 'authenticated', user, error: null });
    } catch (error) {
      setState({
        status: 'error',
        user: null,
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }, [dataSource]);

  useEffect(() => {
    void load();
  }, [load]);

  const logout = useCallback(async (): Promise<void> => {
    await dataSource.logout();
    setState({ status: 'unauthenticated', user: null, error: null });
  }, [dataSource]);

  return { state, reload: load, logout };
};