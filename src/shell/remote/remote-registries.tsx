import { lazy } from 'react';

import type {
  RemoteDefinition,
  RemoteDomain,
  RemoteRegistry,
} from './remote-registry';
import { REMOTE_DEFINITIONS } from './remote-registry';
import { MockRemoteStub } from '../components/MockRemoteStub';

const definitions = new Map<RemoteDefinition['domain'], RemoteDefinition>(
  REMOTE_DEFINITIONS.map((definition) => [definition.domain, definition]),
);

const definitionOf = (domain: RemoteDomain): RemoteDefinition => {
  const definition = definitions.get(domain);
  if (definition === undefined) throw new Error(`Dominio sin remote declarado: ${domain}`);
  return definition;
};

/**
 * Registro que usa los `lazy()` reales de Module Federation.
 * El bundler ve los `import()` literales de `REMOTE_DEFINITIONS` y resuelve
 * cada `remoteEntry.js` declarado en el manifest del ambiente activo.
 */
export class FederationRemoteRegistry implements RemoteRegistry {
  readonly kind = 'federation' as const;

  get(domain: RemoteDomain) {
    return lazy(definitionOf(domain).importRemote);
  }

  definition(domain: RemoteDomain): RemoteDefinition {
    return definitionOf(domain);
  }
}

/**
 * Registro con stubs por dominio. Permite ver y probar el chrome del shell
 * (rutas, Suspense, ErrorBoundary) sin tener los 9 remotes construidos ni servidos.
 * Los stubs se reemplazan por `FederationRemoteRegistry` cuando exista el backend.
 */
export class MockRemoteRegistry implements RemoteRegistry {
  readonly kind = 'mock' as const;

  get(domain: RemoteDomain) {
    const definition = definitionOf(domain);
    return lazy(async () => ({ default: () => <MockRemoteStub definition={definition} /> }));
  }

  definition(domain: RemoteDomain): RemoteDefinition {
    return definitionOf(domain);
  }
}