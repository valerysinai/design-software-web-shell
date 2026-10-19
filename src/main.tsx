import './styles/tokens.css';
import './styles/global.css';

import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthClient, resolveConfig } from '@sena/frontend-platform';

import { ShellRoot } from './app/ShellRoot';
import { resolveSessionDataSource } from './app/data-source/resolve-session-data-source';
import { resolveNotificationDataSource } from './app/data-source/resolve-notification-data-source';
import { resolveRemoteRegistry } from './shell/remote/resolve-remote-registry';
import { bootstrapFederation } from './shell/remote/bootstrap-federation';
import { LoadingRemote } from './shell/components/LoadingRemote/LoadingRemote';
import { RemoteUnavailable } from './shell/components/RemoteUnavailable/RemoteUnavailable';

const config = resolveConfig(import.meta.env.MODE);

const authClient = new AuthClient({
  baseUrl: config.gatewayBaseUrl,
  tokenProvider: {
    getAccessToken: () => sessionStorage.getItem('sena.access_token'),
    clear: () => sessionStorage.removeItem('sena.access_token'),
  },
});

const dataSource = resolveSessionDataSource({
  env: import.meta.env,
  authClient,
});

const remoteRegistry = resolveRemoteRegistry(import.meta.env);

const notificationDataSource = resolveNotificationDataSource({
  env: import.meta.env,
  baseUrl: config.gatewayBaseUrl,
});

const container = document.getElementById('root');
if (container === null) throw new Error('No se encontro el nodo #root');

const root = createRoot(container);

/**
 * E2: el manifest del ambiente se lee ANTES de inicializar Module Federation.
 * Mientras tanto se muestra el estado de carga global.
 */
const start = async (): Promise<void> => {
  const mode = import.meta.env.MODE;

  if (import.meta.env.VITE_REMOTE_SOURCE === 'federation') {
    root.render(
      <StrictMode>
        <Suspense fallback={<LoadingRemote domain="shell" />}>
          <div />
        </Suspense>
      </StrictMode>,
    );
    await bootstrapFederation({ mode });
  }

  root.render(
    <StrictMode>
      <BrowserRouter>
        <ShellRoot
          dataSource={dataSource}
          remoteRegistry={remoteRegistry}
          notificationDataSource={notificationDataSource}
        />
      </BrowserRouter>
    </StrictMode>,
  );
};

void start().catch((error: unknown) => {
  // E3: un fallo al inicializar Federation no puede dejar la pantalla en blanco.
  const message = error instanceof Error ? error.message : String(error);
  root.render(
    <StrictMode>
      <RemoteUnavailable
        domain="la composicion de remotes"
        reason={`No se pudo inicializar Module Federation: ${message}`}
      />
    </StrictMode>,
  );
});