import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { findSenaElement, shadowByRole, shadowHasText } from '../../test/setup';
import { RemoteRoutes } from './RemoteRoutes';
import { MockRemoteRegistry } from './remote-registries';

const renderAt = (path: string, registry = new MockRemoteRegistry()) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <RemoteRoutes registry={registry} manifestSource="remotes.develop.json" />
    </MemoryRouter>,
  );

describe('E2 rutas comodin por dominio', () => {
  it('regresion: la raiz muestra la portada del shell', () => {
    renderAt('/');

    expect(screen.getByRole('heading', { name: /Remotes del shell/i })).toBeInTheDocument();
  });

  it('la raiz lista los 9 dominios', () => {
    renderAt('/');

    for (const name of ['iamMfe', 'schedulingMfe', 'auditMfe', 'monitoringMfe']) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('monta el stub del dominio en su ruta comodin', async () => {
    renderAt('/scheduling/');

    expect(await screen.findByText('schedulingMfe')).toBeInTheDocument();
    expect(screen.getByLabelText('Remote scheduling')).toBeInTheDocument();
  });

  it('monta el stub con ruta interna anidada', async () => {
    renderAt('/academic-management/fichas/fic-01');

    expect(await screen.findByText('academicManagementMfe')).toBeInTheDocument();
  });

  it('una ruta sin remote muestra RemoteUnavailable y no queda en blanco', () => {
    renderAt('/ruta-que-no-existe');

    const unavailable = findSenaElement('sena-remote-unavailable');
    expect(unavailable).not.toBeNull();
    expect(shadowByRole(unavailable as HTMLElement, 'alert')).toBeInTheDocument();
    expect(shadowHasText(unavailable as HTMLElement, /No se pudo cargar/i)).toBe(true);
  });

  it('cada dominio monta en su propia basePath sin invadir al vecino', async () => {
    const { unmount } = renderAt('/audit/');
    expect(await screen.findByText('auditMfe')).toBeInTheDocument();
    expect(screen.queryByText('iamMfe')).not.toBeInTheDocument();
    unmount();

    renderAt('/actors/');
    expect(await screen.findByText('actorsMfe')).toBeInTheDocument();
    expect(screen.queryByText('auditMfe')).not.toBeInTheDocument();
  });
});