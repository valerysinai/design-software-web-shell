import { describe, expect, it } from 'vitest';

import type { SessionDataSource } from '../../app/data-source/session-data-source';
import { LOGIN_PATH, redirectToLogin } from './redirect-to-login';

const client = (hasSession: boolean): SessionDataSource => ({
  kind: 'mock',
  hasSession: () => hasSession,
  getMe: async () => {
    throw new Error('no usado');
  },
  logout: async () => undefined,
});

describe('E3 usuario sin sesion', () => {
  it('redirige al login cuando no hay sesion', () => {
    expect(redirectToLogin(client(false), '/horarios')).toBe(LOGIN_PATH);
  });

  it('conserva la ruta cuando hay sesion', () => {
    expect(redirectToLogin(client(true), '/horarios')).toBe('/horarios');
  });

  it('no apunta al shell cuando no hay sesion', () => {
    expect(redirectToLogin(client(false), '/horarios')).not.toBe('/horarios');
  });
});