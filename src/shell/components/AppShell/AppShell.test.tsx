import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Me } from '@sena/frontend-platform';

import { AppShell } from './AppShell';

const user: Me = {
  id: '3f6c1a52-0f1a-4a1e-9c1b-2b7a5e4d9c10',
  email: 'usuario@example.invalid',
  full_name: 'Usuario de desarrollo',
  actor_type: 'USER',
  roles: [],
  features: ['SCH_CREATE', 'SCH_PUBLISH'],
  modules: ['MOD_DASHBOARD', 'MOD_SCHEDULING'],
} as Me;

describe('E1 layout base — AppShell', () => {
  it('muestra barra superior con marca y menu de usuario', () => {
    render(
      <AppShell user={user} currentPath="/" onNavigate={vi.fn()} onLogout={vi.fn()}>
        <p>contenido</p>
      </AppShell>,
    );

expect(screen.getByText('SENA — Gestión de Horarios')).toBeInTheDocument();
    expect(screen.getByText('Centro de Formación')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'SENA' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Usuario de desarrollo/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });

it('expone las iniciales del usuario', () => {
    render(<AppShell user={user} currentPath="/" onNavigate={vi.fn()} onLogout={vi.fn()} />);

    expect(screen.getAllByText('UD').length).toBeGreaterThan(0);
  });

  it('muestra el name del rol crudo, sin inventar copy', () => {
    // El shell ya no traduce roles a etiquetas. `iam.yaml` no define un enum de
    // roles (`roles[].name` es string libre), asi que se imprime tal cual llega.
    // El nombre legible vive en `GET /roles` → `display_name`.
    render(
      <AppShell
        user={{ ...user, roles: [{ name: 'COORDINATOR', training_center_id: null }] }}
        currentPath="/"
        onNavigate={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(screen.getAllByText('COORDINATOR').length).toBeGreaterThanOrEqual(2);
    // Y no aparece el copy del mockup que estaba hardcodeado.
    expect(screen.queryByText('Coordinador Académico')).toBeNull();
  });

  it('omite el rol cuando el usuario no tiene ninguno', () => {
    // `roles: []` es valido en el contrato y es el caso del mock de desarrollo.
    render(<AppShell user={user} currentPath="/" onNavigate={vi.fn()} onLogout={vi.fn()} />);

    expect(screen.queryByText('COORDINATOR')).toBeNull();
    expect(screen.queryByText('Coordinador Académico')).toBeNull();
  });

  it('colapsa y expande la navegacion desde el boton de la barra superior', async () => {
    render(<AppShell user={user} currentPath="/" onNavigate={vi.fn()} onLogout={vi.fn()} />);

    const toggle = screen.getByRole('button', { name: 'Colapsar menú' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(toggle);

    expect(screen.getByRole('button', { name: 'Expandir menú' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('colapsar el menu lateral no oculta el nombre del usuario', async () => {
    render(<AppShell user={user} currentPath="/" onNavigate={vi.fn()} onLogout={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Colapsar menú' }));

    // El bloque de usuario vive en el topbar, fuera del sidebar: su nombre debe seguir.
    expect(screen.getByText('Usuario de desarrollo')).toBeVisible();
  });

  it('renderiza solo los items permitidos por me.modules', () => {
    render(<AppShell user={user} currentPath="/" onNavigate={vi.fn()} onLogout={vi.fn()} />);

    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(nav).toHaveTextContent('Inicio');
    expect(nav).toHaveTextContent('Horarios');
    expect(nav).not.toHaveTextContent('Documentos');
    expect(nav).not.toHaveTextContent('Auditoría');
  });

  it('expone el enlace de salto al contenido', () => {
    render(<AppShell user={user} currentPath="/" onNavigate={vi.fn()} onLogout={vi.fn()} />);

    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute('href', '#main-content');
  });
});

describe('E4 logout', () => {
  it('invoca onLogout al pulsar Cerrar sesión', async () => {
    const onLogout = vi.fn();
    render(<AppShell user={user} currentPath="/" onNavigate={vi.fn()} onLogout={onLogout} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});

describe('navegacion del shell', () => {
  it('navega al path del item pulsado', async () => {
    const onNavigate = vi.fn();
    render(<AppShell user={user} currentPath="/" onNavigate={onNavigate} onLogout={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Horarios' }));

    expect(onNavigate).toHaveBeenCalledWith('/scheduling/horarios');
  });

  it('marca aria-current en el item activo', () => {
    render(<AppShell user={user} currentPath="/scheduling/horarios" onNavigate={vi.fn()} onLogout={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Horarios' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
  });
});
