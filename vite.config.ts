import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';
import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig, type Plugin } from 'vitest/config';

import { FEDERATION_HOST_NAME, SHARED_SINGLETONS } from './src/shell/remote/federation.config';
import { REMOTE_DEFINITIONS, type FederationName } from './src/shell/remote/remote-registry';
import { ENVIRONMENTS, manifestFileFor, resolveEnvironment } from './src/shell/remote/environments';

const REMOTE_NAMES = REMOTE_DEFINITIONS.map((definition) => definition.federationName);

const manifestPathFor = (environment: string): string =>
  fileURLToPath(new URL(`./remotes/${manifestFileFor(environment)}`, import.meta.url));

/**
 * E2: `fetch('/remotes.<env>.json')` en runtime debe encontrar el manifest.
 *
 * Vite solo sirve `public/` como estatico, y los manifests viven en `remotes/` en la raiz
 * del repo para no duplicarlos. Sin este plugin:
 * - en `dev`, la ruta cae al index.html del shell y `bootstrapFederation` lanza "Invalid URL";
 * - en `build`, el archivo no existe en `dist` y el deploy falla igual.
 *
 * Este plugin sirve los manifests en dev y los copia a `dist` en build.
 */
const remoteManifestPlugin = (): Plugin => ({
  name: 'sena-remote-manifest',
  configureServer(server) {
    for (const environment of ENVIRONMENTS) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== `/${manifestFileFor(environment)}`) return next();
        res.setHeader('Content-Type', 'application/json');
        res.end(readFileSync(manifestPathFor(environment), 'utf8'));
      });
    }
  },
  generateBundle() {
    for (const environment of ENVIRONMENTS) {
      this.emitFile({
        type: 'asset',
        fileName: manifestFileFor(environment),
        source: readFileSync(manifestPathFor(environment), 'utf8'),
      });
    }
  },
});

/**
 * E2: las URLs de `remoteEntry.js` NO viven en codigo. Se leen del manifest del
 * ambiente activo y ese archivo JSON es la unica fuente de verdad.
 */
type ViteRemoteConfig = { name: string; type: 'module'; entry: string };

const readManifest = (environment: string): Partial<Record<FederationName, string>> => {
  const file = manifestPathFor(environment);
  try {
    const raw: unknown = JSON.parse(readFileSync(file, 'utf8'));
    if (typeof raw !== 'object' || raw === null) return {};
    return Object.fromEntries(
      Object.entries(raw as Record<string, unknown>).filter(
        ([, value]) => typeof value === 'string' && value !== '',
      ),
    ) as Partial<Record<FederationName, string>>;
  } catch {
    return {};
  }
};

const stubPath = fileURLToPath(
  new URL('./src/shell/remote/__fixtures__/FederatedRemoteFixture.tsx', import.meta.url),
);

const stubAliasRecord = (): Record<string, string> =>
  Object.fromEntries(REMOTE_DEFINITIONS.map((d) => [`${d.federationName}/App`, stubPath]));

const moduleRemoteRecord = (
  manifest: Partial<Record<FederationName, string>>,
): Partial<Record<FederationName, ViteRemoteConfig>> =>
  Object.fromEntries(
    Object.entries(manifest).map(([name, entry]) => [
      name,
      { name, type: 'module' as const, entry },
    ]),
  ) as Partial<Record<FederationName, ViteRemoteConfig>>;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const environment = resolveEnvironment(mode);
  const manifest = readManifest(environment);
  const missing = REMOTE_NAMES.filter((name) => manifest[name] === undefined);

  // El shell trabaja con stubs mientras los remotes no estan construidos ni desplegados,
  // o cuando desarrollo pide explicitamente `VITE_REMOTE_SOURCE=mock`.
  const useStubs = env['VITE_REMOTE_SOURCE'] !== 'federation' || missing.length > 0;

  if (useStubs) {
    console.warn(
      `[federation] ${manifestFileFor(environment)} no declara: ${missing.join(', ')}. ` +
        'Se usaran stubs hasta que el ambiente declare las URLs.',
    );
  }

  return {
    plugins: [
      react(),
      remoteManifestPlugin(),
      // El plugin de Federation solo se registra cuando hay URLs reales declaradas.
      // En modo stubs queda fuera y los imports se resuelven con el alias local.
      ...(useStubs
        ? []
        : [
            federation({
              name: FEDERATION_HOST_NAME,
              remotes: moduleRemoteRecord(manifest),
              shared: { ...SHARED_SINGLETONS },
              // El gate de tipos entre host y remote es `HU-SHELL-008`. Mientras tanto
              // se desactiva para no intentar descargar `@mf-types.zip` de remotes que
              // no estan levantados, lo que inundaba la consola de errores.
              dts: false,
            }),
          ]),
    ],
    resolve: {
      alias: {
        ...(useStubs ? stubAliasRecord() : {}),
        '@sena/frontend-platform': fileURLToPath(
          new URL('../design-software-frontend-platform/src/index.ts', import.meta.url),
        ),
        // HU-SHELL-005: el shell consume los tokens canonicos de `design-system`.
        // El alias especifico va PRIMERO: Vite resuelve en orden y el alias corto
        // capturaria `@sena/design-system/tokens.css` contra el entry TS.
        '@sena/design-system/tokens.css': fileURLToPath(
          new URL('../design-software-design-system/src/tokens/tokens.generated.css', import.meta.url),
        ),
        // HU-SHELL-006: los Web Components base. Tambien antes del alias corto.
        '@sena/design-system/components': fileURLToPath(
          new URL('../design-software-design-system/src/components/index.ts', import.meta.url),
        ),
        '@sena/design-system': fileURLToPath(
          new URL('../design-software-design-system/src/index.ts', import.meta.url),
        ),
      },
    },
    server: {
      port: 5000,
      proxy: {
        '/api/v1': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
        '/time-slots': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      // `smoke/` necesita el dev server y los MFEs levantados (5101-5109). Corre aparte
      // con `npm run test:smoke`, fuera del unit suite.
      include: ['src/**/*.test.{ts,tsx}'],
      alias: [{ find: /^[^/]+Mfe\/App$/, replacement: stubPath }],
    },
  };
});
