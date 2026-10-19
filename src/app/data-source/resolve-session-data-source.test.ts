import { describe, expect, it } from 'vitest';
import { AuthClient } from '@sena/frontend-platform';

import { MockSessionDataSource } from './mock-session-data-source';
import { HttpSessionDataSource } from './http-session-data-source';
import { resolveSessionDataSource } from './resolve-session-data-source';

const authClientStub = (): AuthClient =>
  new AuthClient({
    baseUrl: '/api/v1',
    tokenProvider: { getAccessToken: () => 'token', clear: () => undefined },
    fetchImpl: async () => new Response(null, { status: 204 }),
  });

describe('selector de fuente de datos', () => {
  it('usa mock por defecto cuando no hay variable de entorno', () => {
    const source = resolveSessionDataSource({ env: {}, authClient: authClientStub() });

    expect(source.kind).toBe('mock');
  });

  it('usa mock cuando la variable no es valida', () => {
    const source = resolveSessionDataSource({
      env: { VITE_SESSION_SOURCE: 'otro' },
      authClient: authClientStub(),
    });

    expect(source.kind).toBe('mock');
  });

  it('usa http cuando VITE_SESSION_SOURCE=http', () => {
    const source = resolveSessionDataSource({
      env: { VITE_SESSION_SOURCE: 'http' },
      authClient: authClientStub(),
    });

    expect(source.kind).toBe('http');
    expect(source).toBeInstanceOf(HttpSessionDataSource);
  });
});

describe('MockSessionDataSource', () => {
  it('no simula ninguna persona con rol', async () => {
    // Ninguna HU define un rol para el shell y `iam.yaml` no define un enum de
    // roles: `roles[].name` es string libre. El mock no puede inventar uno.
    const me = await new MockSessionDataSource().getMe();

    expect(me.roles).toEqual([]);
    expect(me.features).toEqual([]);
  });

  it('no usa nombres de personas reales del mockup', async () => {
    const me = await new MockSessionDataSource().getMe();

    // Antes devolvía 'María García', 'Juan Pérez', … copiados del mockup v2.
    for (const nombre of ['María García', 'Juan Pérez', 'Laura Martínez', 'Carlos Ramírez', 'Ana Torres']) {
      expect(me.full_name).not.toBe(nombre);
    }
    expect(me.email.endsWith('.invalid')).toBe(true);
  });

  it('declara modules porque E2 deriva la navegación de ahí', async () => {
    const me = await new MockSessionDataSource().getMe();

    // Sin modulesGranted el menú quedaría vacío y no se podría validar el chrome.
    expect(me.modules.length).toBeGreaterThan(0);
  });

  it('devuelve una copia para que el consumidor no mute el fixture', async () => {
    const source = new MockSessionDataSource();

    const first = await source.getMe();
    first.full_name = 'alterado';
    first.modules.push('MOD_INVENTADO');

    const second = await source.getMe();
    expect(second.full_name).toBe('Usuario de desarrollo');
    expect(second.modules).not.toContain('MOD_INVENTADO');
  });

  it('siempre declara sesion activa porque la mock no usa token', () => {
    expect(new MockSessionDataSource().hasSession()).toBe(true);
  });

  it('logout no falla en modo mock', async () => {
    await expect(new MockSessionDataSource().logout()).resolves.toBeUndefined();
  });
});