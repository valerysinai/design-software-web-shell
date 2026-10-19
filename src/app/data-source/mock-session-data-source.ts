import type { Me } from '@sena/frontend-platform';

import { MOCK_SESSION } from './fixtures/session.fixtures';
import type { SessionDataSource } from './session-data-source';

export class MockSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MockSessionError';
  }
}

/**
 * Fuente de datos de sesión para desarrollo, sin backend.
 *
 * Usa los tipos generados del OpenAPI, de modo que cambiar a la fuente real no
 * obliga a tocar componentes, hooks ni tests.
 *
 * Antes aceptaba una `persona` (coordinator / instructor / …) y devolvía una de
 * las 5 personas del mockup. Se retiró esa selección: los roles no están
 * definidos en ninguna HU ni en el contrato, y mantenerlos fijaba un catálogo
 * falso. Ver `fixtures/session.fixtures.ts`.
 */
export class MockSessionDataSource implements SessionDataSource {
  readonly kind = 'mock' as const;

  hasSession(): boolean {
    return true;
  }

  async getMe(): Promise<Me> {
    return structuredClone(MOCK_SESSION);
  }

  async logout(): Promise<void> {
    return Promise.resolve();
  }
}