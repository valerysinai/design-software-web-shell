import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { Me } from '@sena/frontend-platform';

import { useCurrentUser } from './use-current-user';
import type { SessionDataSource } from '../data-source/session-data-source';

const mePayload = {
  id: '3f6c1a52-0f1a-4a1e-9c1b-2b7a5e4d9c10',
  email: 'laura.martinez@soy.sena.edu.co',
  full_name: 'Laura Martínez',
  actor_type: 'LEARNER',
  actor_id: 'a1b2c3d4-0000-4000-8000-000000000001',
  roles: [{ name: 'LEARNER', training_center_id: 'c1d2e3f4-0000-4000-8000-000000000002' }],
  features: ['SCH_VIEW_OWN'],
  modules: ['MOD_SCHEDULING', 'MOD_MONITORING'],
} as Me;

const stub = (
  overrides: Partial<SessionDataSource> = {},
  getMe: () => Promise<Me> = async () => mePayload,
): SessionDataSource => ({
  kind: 'mock',
  hasSession: () => true,
  getMe,
  logout: async () => undefined,
  ...overrides,
});

describe('useCurrentUser', () => {
  it('expone el usuario autenticado con sus modulos', async () => {
    const { result } = renderHook(() => useCurrentUser(stub()));

    await waitFor(() => expect(result.current.state.status).toBe('authenticated'));
    expect(result.current.state.user?.full_name).toBe('Laura Martínez');
    expect(result.current.state.user?.modules).toEqual(['MOD_SCHEDULING', 'MOD_MONITORING']);
  });

  it('queda en loading mientras resuelve la sesion', async () => {
    const { result } = renderHook(() => useCurrentUser(stub()));

    expect(result.current.state.status).toBe('loading');
    await waitFor(() => expect(result.current.state.status).toBe('authenticated'));
  });

  it('queda unauthenticated sin sesion y no consulta la fuente', async () => {
    const getMe = vi.fn(async () => mePayload);
    const source = stub({ hasSession: () => false }, getMe);

    const { result } = renderHook(() => useCurrentUser(source));

    await waitFor(() => expect(result.current.state.status).toBe('unauthenticated'));
    expect(getMe).not.toHaveBeenCalled();
  });

  it('reporta error cuando la fuente de datos falla', async () => {
    const source = stub({}, async () => {
      throw new Error('TOKEN_EXPIRED');
    });

    const { result } = renderHook(() => useCurrentUser(source));

    await waitFor(() => expect(result.current.state.status).toBe('error'));
    expect(result.current.state.error).toBe('TOKEN_EXPIRED');
  });

  it('E4 limpia la sesion y vuelve a unauthenticated tras logout', async () => {
    const logout = vi.fn(async () => undefined);
    const source = stub({ logout });

    const { result } = renderHook(() => useCurrentUser(source));
    await waitFor(() => expect(result.current.state.status).toBe('authenticated'));

    await act(async () => {
      await result.current.logout();
    });

    expect(logout).toHaveBeenCalledTimes(1);
    expect(result.current.state.status).toBe('unauthenticated');
    expect(result.current.state.user).toBeNull();
  });
});