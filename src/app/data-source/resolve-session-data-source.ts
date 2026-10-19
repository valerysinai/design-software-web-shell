import type { AuthClient } from '@sena/frontend-platform';

import { HttpSessionDataSource } from './http-session-data-source';
import { MockSessionDataSource } from './mock-session-data-source';
import { SESSION_SOURCE_ENV, type SessionDataSource, type SessionSource } from './session-data-source';

const isSessionSource = (value: string | undefined): value is SessionSource =>
  value === 'mock' || value === 'http';

const isEnabled = (value: unknown): boolean => value === true || value === 'true' || value === '1';

/**
 * Selector de la fuente de datos de sesion.
 *
 * Con `VITE_SESSION_SOURCE=mock` (por defecto) el shell usa una sesion generica
 * para validar el chrome. Con `VITE_SESSION_SOURCE=http` usa `GET /auth/me` y
 * `POST /auth/logout` reales. Ningun componente cambia entre un modo y otro.
 */
export const resolveSessionDataSource = ({
  env,
  authClient,
}: {
  env: Record<string, unknown>;
  authClient: AuthClient;
}): SessionDataSource => {
  const raw: unknown = env[SESSION_SOURCE_ENV];
  const source = typeof raw === 'string' && isSessionSource(raw) ? raw : 'mock';
  const allowLocalSession = isEnabled(env['VITE_LOCAL_SESSION']);
  return source === 'http'
    ? new HttpSessionDataSource(authClient, allowLocalSession)
    : new MockSessionDataSource();
};
