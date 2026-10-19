import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import type { SessionDataSource } from '../../app/data-source/session-data-source';
import { RequireSession } from './RequireSession';
import { LOGIN_PATH } from './redirect-to-login';

const client = (hasSession: boolean): SessionDataSource => ({
  kind: 'mock',
  hasSession: () => hasSession,
  getMe: async () => {
    throw new Error('no usado');
  },
  logout: async () => undefined,
});

const LoginSpy = () => {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return (
    <div>
      <p>login</p>
      <span data-testid="from">{from ?? 'sin from'}</span>
    </div>
  );
};

const renderAt = (path: string, hasSession: boolean) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={LOGIN_PATH} element={<LoginSpy />} />
        <Route
          path="*"
          element={
            <RequireSession dataSource={client(hasSession)}>
              <p>contenido protegido</p>
            </RequireSession>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

describe('E3 guard de sesion sobre el router', () => {
  it('deja ver el contenido cuando hay sesion', () => {
    renderAt('/horarios', true);

    expect(screen.getByText('contenido protegido')).toBeInTheDocument();
    expect(screen.queryByText('login')).not.toBeInTheDocument();
  });

  it('redirige al login cuando no hay sesion', () => {
    renderAt('/horarios', false);

    expect(screen.getByText('login')).toBeInTheDocument();
    expect(screen.queryByText('contenido protegido')).not.toBeInTheDocument();
  });

  it('preserva la ruta de retorno para que el login devuelva al usuario', () => {
    renderAt('/horarios?tab=manana', false);

    expect(screen.getByTestId('from')).toHaveTextContent('/horarios?tab=manana');
  });

  it('no deja pasar al shell vacio sin sesion', () => {
    renderAt('/iam/', false);

    expect(screen.queryByText('contenido protegido')).not.toBeInTheDocument();
  });
});