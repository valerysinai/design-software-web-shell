import { init } from '@module-federation/runtime';

import { FEDERATION_HOST_NAME } from './federation.config';
import { loadRemoteManifest, type LoadedManifest } from './manifest';
import type { FederationName } from './remote-registry';

export interface BootstrapFederationOptions {
  mode: string | undefined;
  basePath?: string;
  fetchImpl?: typeof fetch;
}

export interface FederationBootstrap {
  manifest: LoadedManifest;
  /** `true` cuando Module Federation quedo inicializado con URLs reales. */
  initialized: boolean;
}

/**
 * E2 (ADR-009 §9): lee `remotes.<env>.json` segun el ambiente activo **antes** de
 * inicializar Module Federation, y registra las URLs con `init()`.
 *
 * Ninguna URL de `remoteEntry.js` queda hardcodeada en el codigo: el manifest es la
 * unica fuente. Si el ambiente aun no declara URLs, `init()` se omite y el shell opera
 * con el registro de stubs (`VITE_REMOTE_SOURCE=mock`).
 */
export const bootstrapFederation = async ({
  mode,
  basePath,
  fetchImpl,
}: BootstrapFederationOptions): Promise<FederationBootstrap> => {
  const manifest = await loadRemoteManifest({ mode, basePath, fetchImpl });

  if (manifest.isEmpty) return { manifest, initialized: false };

  const remotes = (Object.entries(manifest.manifest) as [FederationName, string][]).map(
    ([name, url]) => ({ name, entry: url, type: 'module' as const }),
  );

  // Los `shared: { singleton, requiredVersion }` se declaran en tiempo de build
  // (vite.config.ts), que es donde evitan el React duplicado. El `init()` de runtime
  // solo necesita nombre del host y las URLs de los remotes.
  await init({ name: FEDERATION_HOST_NAME, remotes });

  return { manifest, initialized: true };
};
