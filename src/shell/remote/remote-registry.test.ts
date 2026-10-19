import { describe, expect, it } from 'vitest';

import { FederationRemoteRegistry, MockRemoteRegistry } from './remote-registries';
import { resolveRemoteRegistry } from './resolve-remote-registry';
import { REMOTE_DEFINITIONS, isRemoteDomain } from './remote-registry';

describe('E4 shared singletons', () => {
  it('declara react, react-dom y react-router-dom como singleton', async () => {
    const { SHARED_SINGLETONS } = await import('./federation.config');

    expect(SHARED_SINGLETONS.react.singleton).toBe(true);
    expect(SHARED_SINGLETONS['react-dom'].singleton).toBe(true);
    expect(SHARED_SINGLETONS['react-router-dom'].singleton).toBe(true);
  });

  it('usa la misma requiredVersion que los 9 MFE', async () => {
    const { SHARED_SINGLETONS } = await import('./federation.config');

    expect(SHARED_SINGLETONS.react.requiredVersion).toBe('^18.3.1');
    expect(SHARED_SINGLETONS['react-router-dom'].requiredVersion).toBe('^6.30.1');
  });

  it('identifica el host con un nombre estable', async () => {
    const { FEDERATION_HOST_NAME } = await import('./federation.config');

    expect(FEDERATION_HOST_NAME).toBe('webShell');
  });
});

describe('registro de remotes', () => {
  it('declara los 9 dominios con ruta base unica', () => {
    expect(REMOTE_DEFINITIONS).toHaveLength(9);

    const basePaths = REMOTE_DEFINITIONS.map((definition) => definition.basePath);
    expect(new Set(basePaths).size).toBe(9);
  });

  it('resuelve definicion y componente para cada dominio', () => {
    for (const registry of [new MockRemoteRegistry(), new FederationRemoteRegistry()]) {
      for (const definition of REMOTE_DEFINITIONS) {
        expect(registry.definition(definition.domain).federationName).toBe(definition.federationName);
        expect(registry.get(definition.domain)).toBeDefined();
      }
    }
  });

  it('falla de forma explicita ante un dominio no declarado', () => {
    const registry = new MockRemoteRegistry();

    expect(() => registry.definition('inventado' as never)).toThrow(/Dominio sin remote declarado/);
  });

  it('valida si un string es un dominio soportado', () => {
    expect(isRemoteDomain('scheduling')).toBe(true);
    expect(isRemoteDomain('notification')).toBe(false);
  });
});

describe('selector de fuente de remotes', () => {
  it('usa mock por defecto', () => {
    expect(resolveRemoteRegistry({}).kind).toBe('mock');
  });

  it('usa mock si el valor no es valido', () => {
    expect(resolveRemoteRegistry({ VITE_REMOTE_SOURCE: 'otro' }).kind).toBe('mock');
  });

  it('usa federation cuando VITE_REMOTE_SOURCE=federation', () => {
    expect(resolveRemoteRegistry({ VITE_REMOTE_SOURCE: 'federation' }).kind).toBe('federation');
  });
});