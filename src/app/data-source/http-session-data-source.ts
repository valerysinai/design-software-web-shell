import type { AuthClient, Me } from '@sena/frontend-platform';

import type { SessionDataSource } from './session-data-source';

/**
 * Fuente de datos real. Delega en `AuthClient` de `frontend-platform`, que es
 * el unico lugar autorizado para hablar con `GET /auth/me` y `POST /auth/logout`.
 */
export class HttpSessionDataSource implements SessionDataSource {
  readonly kind = 'http' as const;

  constructor(
    private readonly authClient: AuthClient,
    private readonly allowLocalSession = false,
  ) {}

  hasSession(): boolean {
    return this.allowLocalSession || this.authClient.hasSession;
  }

  async getMe(): Promise<Me> {
    return this.authClient.getMe();
  }

  async logout(): Promise<void> {
    return this.authClient.logout();
  }
}
