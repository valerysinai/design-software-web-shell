import { manifestFileForEnvironment, resolveEnvironment, type AppEnvironment } from './environments';
import {
  REMOTE_DEFINITIONS,
  type FederationName,
  type RemoteManifest,
} from './remote-registry';

export { manifestFileForEnvironment, resolveEnvironment };
export type { AppEnvironment };

export const manifestFileFor = manifestFileForEnvironment;

/**
 * E2: normaliza y valida el manifest de un ambiente.
 *
 * Reglas:
 * - No se acepta una entrada vacia: `{ "iamMfe": "" }` es un error, no una URL valida.
 * - Toda entrada debe terminar en `remoteEntry.js`.
 * - Se reportan los federation names que el manifest no cubre.
 */
export const validateManifest = (
  raw: unknown,
): { manifest: RemoteManifest; missing: FederationName[] } => {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('El manifest de remotes debe ser un objeto JSON');
  }

  const entries = Object.entries(raw as Record<string, unknown>);
  const required = REMOTE_DEFINITIONS.map((definition) => definition.federationName);
  const present = entries.filter(([, value]) => typeof value === 'string' && value !== '');
  const providedNames = present.map(([key]) => key as FederationName);
  const missing = required.filter((name) => !providedNames.includes(name));

  const manifest = Object.fromEntries(present) as RemoteManifest;

  for (const [key, value] of Object.entries(manifest)) {
    if (!String(value).endsWith('remoteEntry.js')) {
      throw new Error(`El manifest declara "${key}" con una URL que no termina en remoteEntry.js`);
    }
  }

  return { manifest, missing };
};

export interface LoadedManifest {
  environment: AppEnvironment;
  source: string;
  manifest: RemoteManifest;
  missing: FederationName[];
  isEmpty: boolean;
}

export interface LoadManifestOptions {
  mode: string | undefined;
  basePath?: string;
  fetchImpl?: typeof fetch;
}

/**
 * Carga `remotes.<env>.json` en runtime segun el ambiente activo.
 * Es la unica fuente de URLs de `remoteEntry.js`: no hay ninguna en el codigo.
 */
export const loadRemoteManifest = async ({
  mode,
  basePath = '/',
  fetchImpl = fetch,
}: LoadManifestOptions): Promise<LoadedManifest> => {
  const environment = resolveEnvironment(mode);
  const file = manifestFileFor(environment);
  const source = `${basePath.endsWith('/') ? basePath : `${basePath}/`}${file}`;

  const response = await fetchImpl(source);
  if (!response.ok) {
    throw new Error(`No se pudo leer ${source} (HTTP ${response.status})`);
  }

  const { manifest, missing } = validateManifest(await response.json());

  return {
    environment,
    source,
    manifest,
    missing,
    isEmpty: Object.keys(manifest).length === 0,
  };
};