import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import type { SessionDataSource } from './data-source/session-data-source';
import type { NotificationDataSource } from './data-source/notification-data-source';
import { useCurrentUser } from './hooks/use-current-user';
import type { RemoteRegistry } from '../shell/remote/remote-registry';
import { AppShell } from '../shell/components/AppShell';
import { RemoteRoutes } from '../shell/remote/RemoteRoutes';
import { RequireSession } from '../shell/guards/RequireSession';
import { OfflineBanner } from '../shell/components/OfflineBanner';
import { useOnlineStatus } from '../shell/hooks/use-online-status';

export interface ShellRootProps {
  dataSource: SessionDataSource;
  remoteRegistry: RemoteRegistry;
  notificationDataSource?: NotificationDataSource;
  /** Ruta del manifest de remotes del ambiente activo. Se muestra en modo desarrollo. */
  manifestSource?: string;
}

/**
 * E1: el shell es el unico dueno del router. Este componente se monta dentro del
 * `BrowserRouter` de `main.tsx` y no crea ninguno propio.
 *
 * E3: `RequireSession` envuelve el shell. Sin sesion valida navega al login preservando
 * la ruta de retorno en `state.from`, en lugar del texto estatico de `HU-SHELL-001`.
 *
 * E4: `OfflineBanner` avisa la perdida de conectividad una sola vez, sobre el contenido.
 */
export const ShellRoot = ({
  dataSource,
  remoteRegistry,
  notificationDataSource,
  manifestSource,
}: ShellRootProps) => {
  const { state, logout } = useCurrentUser(dataSource);

  // El router es la unica fuente de verdad de la ruta. Mantener un `useState` paralelo
  // con `pushState` manual desincroniza el shell: la URL cambia pero la vista no.
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onNavigate = useCallback((next: string) => navigate(next), [navigate]);

  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (state.status === 'authenticated' && pathname === '/login') {
      navigate('/', { replace: true });
    }
  }, [navigate, pathname, state.status]);

  const handleLogout = useCallback(async (): Promise<void> => {
    await logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  if (state.status === 'loading') {
    return <div role="status">Cargando sesion...</div>;
  }

  if (state.status === 'error') {
    return <div role="alert">No se pudo cargar la sesion: {state.error}</div>;
  }

  // `unauthenticated` tambien pasa por el guard: `RequireSession` decide si deja ver el
  // shell (sesion presente pero `GET /auth/me` todavia no resolvio) o redirige al login.
  return (
    <RequireSession dataSource={dataSource}>
      {state.user !== null && (
        <AppShell
          user={state.user}
          currentPath={pathname}
          onNavigate={onNavigate}
          onLogout={() => void handleLogout()}
          {...(notificationDataSource === undefined ? {} : { notificationDataSource })}
        >
          {isOnline ? null : <OfflineBanner />}
          <RemoteRoutes registry={remoteRegistry} manifestSource={manifestSource} />
        </AppShell>
      )}
    </RequireSession>
  );
};
