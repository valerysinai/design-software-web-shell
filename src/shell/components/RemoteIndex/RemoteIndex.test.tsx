import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RemoteIndex, type RemoteIndexEntry } from './RemoteIndex';

const REMOTES: RemoteIndexEntry[] = [
  { domain: 'iam', federationName: 'iamMfe', basePath: '/iam' },
  { domain: 'scheduling', federationName: 'schedulingMfe', basePath: '/scheduling' },
];

const renderIndex = (props: Partial<React.ComponentProps<typeof RemoteIndex>> = {}) =>
  render(
    <RemoteIndex remotes={REMOTES} registryKind="mock" manifestSource="remotes.develop.json" {...props} />,
  );

describe('RemoteIndex', () => {
  it('muestra el nombre del remote y su ruta comodin', () => {
    renderIndex();

    expect(screen.getByRole('heading', { name: /Remotes del shell/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iamMfe/ })).toBeInTheDocument();
    expect(screen.getByText('/iam/*')).toBeInTheDocument();
    expect(screen.getByText('/scheduling/*')).toBeInTheDocument();
  });

  it('expone cada tarjeta como boton navegable', async () => {
    const onNavigate = vi.fn();
    renderIndex({ onNavigate });

    await userEvent.click(screen.getByRole('button', { name: /schedulingMfe/ }));

    expect(onNavigate).toHaveBeenCalledWith('/scheduling/');
  });

  it('avisa que los registros estan simulados solo en modo mock', () => {
    const { unmount } = renderIndex();
    expect(screen.getByText(/Registros simulados/i)).toBeInTheDocument();
    unmount();

    renderIndex({ registryKind: 'federation' });
    expect(screen.queryByText(/Registros simulados/i)).not.toBeInTheDocument();
  });
});