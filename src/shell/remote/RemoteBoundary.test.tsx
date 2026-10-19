import { describe, expect, it, vi } from 'vitest';
import { lazy } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  findSenaElement,
  shadowByRole,
  shadowButton,
  shadowHasText,
} from '../../test/setup';
import { RemoteUnavailable } from '../components/RemoteUnavailable/RemoteUnavailable';
import { RemoteBoundary } from './RemoteBoundary';

const Boom = () => {
  throw new Error('remoteEntry.js no responde');
};

const Ready = () => <p>remote montado</p>;

const silenceReactErrorLog = () => vi.spyOn(console, 'error').mockImplementation(() => undefined);

/**
 * HU-SHELL-006: `LoadingRemote` y `RemoteUnavailable` ya no son placeholders del
 * shell, son Web Components del design-system. Por eso las aserciones bajan a su
 * shadow root con `shadowByRole`/`shadowHasText` en vez de usar `screen`.
 *
 * Lo que se verifica aqui es el cableado del shell: que monta el elemento
 * correcto y le pasa `domain` y `reason`. El contenido del shadow ya lo cubren
 * los 85 tests del design-system.
 */
describe('E1 montage con Suspense y ErrorBoundary', () => {
  it('renderiza el remote cuando resuelve correctamente', () => {
    render(
      <RemoteBoundary domain="scheduling">
        <Ready />
      </RemoteBoundary>,
    );

    expect(screen.getByText('remote montado')).toBeInTheDocument();
    expect(findSenaElement('sena-loading-remote')).toBeNull();
  });

  it('muestra LoadingRemote mientras el remote no resuelve', () => {
    const NeverResolves = lazy(() => new Promise<{ default: () => null }>(() => undefined));

    render(
      <RemoteBoundary domain="iam">
        <NeverResolves />
      </RemoteBoundary>,
    );

    const loading = findSenaElement('sena-loading-remote');
    expect(loading).not.toBeNull();
    expect(loading).toHaveAttribute('domain', 'iam');
    // El estado de carga se anuncia a lectores de pantalla.
    expect(shadowByRole(loading as HTMLElement, 'status')).toBeInTheDocument();
    expect(shadowHasText(loading as HTMLElement, 'iam')).toBe(true);
  });
});

describe('E3 remote inalcanzable', () => {
  it('muestra RemoteUnavailable en vez de una pantalla en blanco', () => {
    const spy = silenceReactErrorLog();

    render(
      <RemoteBoundary domain="audit">
        <Boom />
      </RemoteBoundary>,
    );

    const unavailable = findSenaElement('sena-remote-unavailable');
    expect(unavailable).not.toBeNull();
    expect(unavailable).toHaveAttribute('domain', 'audit');
    expect(shadowByRole(unavailable as HTMLElement, 'alert')).toBeInTheDocument();
    expect(shadowHasText(unavailable as HTMLElement, /No se pudo cargar/i)).toBe(true);
    expect(shadowHasText(unavailable as HTMLElement, 'audit')).toBe(true);

    spy.mockRestore();
  });

  it('expone el motivo del fallo y ofrece reintento', async () => {
    const spy = silenceReactErrorLog();

    render(
      <RemoteBoundary domain="document">
        <Boom />
      </RemoteBoundary>,
    );

    const unavailable = findSenaElement('sena-remote-unavailable');
    expect(unavailable).not.toBeNull();
    expect(unavailable).toHaveAttribute('reason', 'remoteEntry.js no responde');
    expect(shadowHasText(unavailable as HTMLElement, 'remoteEntry.js no responde')).toBe(true);

    const retry = shadowButton(unavailable as HTMLElement);
    expect(retry).toHaveTextContent(/Reintentar/i);

    // El wrapper traduce `sena-retry` a la prop `onRetry` de React.
    await userEvent.click(retry);
    expect(shadowHasText(unavailable as HTMLElement, 'remoteEntry.js no responde')).toBe(true);

    spy.mockRestore();
  });

  it('el reintento del design-system llega a la funcion onRetry', async () => {
    const spy = silenceReactErrorLog();
    const onRetry = vi.fn();

    // `RemoteBoundary` inyecta su propio `retry`; para comprobar el cableado
    // del wrapper se monta `RemoteUnavailable` directo, que es quien traduce el
    // evento `sena-retry` a la prop de React.
    render(<RemoteUnavailable domain="monitoring" reason="caido" onRetry={onRetry} />);

    const unavailable = findSenaElement('sena-remote-unavailable');
    expect(unavailable).not.toBeNull();
    expect(unavailable).toHaveAttribute('reason', 'caido');

    // El Web Component emite `sena-retry`; sin el wrapper este clic no llamaria
    // a `onRetry`, porque el Custom Element no conoce la funcion del host.
    await userEvent.click(shadowButton(unavailable as HTMLElement));

    expect(onRetry).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('no rompe cuando no hay onRetry', async () => {
    const spy = silenceReactErrorLog();

    render(
      <RemoteBoundary domain="actors">
        <Boom />
      </RemoteBoundary>,
    );

    const unavailable = findSenaElement('sena-remote-unavailable');
    expect(unavailable).not.toBeNull();
    await expect(
      userEvent.click(shadowButton(unavailable as HTMLElement)),
    ).resolves.toBeUndefined();

    spy.mockRestore();
  });

  it('notifica el error al consumidor', () => {
    const onError = vi.fn();
    const spy = silenceReactErrorLog();

    render(
      <RemoteBoundary domain="monitoring" onError={onError}>
        <Boom />
      </RemoteBoundary>,
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);

    spy.mockRestore();
  });

  it('no propaga el fallo de un remote a los hermanos', () => {
    const spy = silenceReactErrorLog();

    render(
      <div>
        <p>shell vivo</p>
        <RemoteBoundary domain="audit">
          <Boom />
        </RemoteBoundary>
      </div>,
    );

    expect(screen.getByText('shell vivo')).toBeInTheDocument();
    expect(findSenaElement('sena-remote-unavailable')).not.toBeNull();

    spy.mockRestore();
  });
});