import type { RemoteRegistry } from './remote-registry';
import { FederationRemoteRegistry, MockRemoteRegistry } from './remote-registries';

export const REMOTE_SOURCE_ENV = 'VITE_REMOTE_SOURCE';
export type RemoteSource = 'mock' | 'federation';

const isRemoteSource = (value: unknown): value is RemoteSource => value === 'mock' || value === 'federation';

/**
 * Selector del registro de remotes.
 *
 * `VITE_REMOTE_SOURCE=mock` (default) sirve stubs por dominio para validar el chrome
 * sin construir los 9 remotes. `VITE_REMOTE_SOURCE=federation` usa los `lazy()` reales
 * de Module Federation contra las URLs de `remotes.<env>.json`.
 */
export const resolveRemoteRegistry = (env: Record<string, unknown>): RemoteRegistry => {
  const raw = env[REMOTE_SOURCE_ENV];
  const source: RemoteSource = isRemoteSource(raw) ? raw : 'mock';
  return source === 'federation' ? new FederationRemoteRegistry() : new MockRemoteRegistry();
};