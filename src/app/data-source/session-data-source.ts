import type { Me } from '@sena/frontend-platform';

/**
 * Contrato de datos de sesion que consume el shell.
 *
 * Hoy se resuelve contra fixtures quemados para validar UX/UI; mañana se
 * resuelve contra `GET /auth/me` y `POST /auth/logout` reales.
 * Los componentes y hooks dependen solo de esta interfaz, nunca de `fetch`
 * ni de una implementacion concreta.
 */
export interface SessionDataSource {
  readonly kind: 'mock' | 'http';
  hasSession(): boolean;
  getMe(): Promise<Me>;
  logout(): Promise<void>;
}

export const SESSION_SOURCE_ENV = 'VITE_SESSION_SOURCE';

export type SessionSource = 'mock' | 'http';