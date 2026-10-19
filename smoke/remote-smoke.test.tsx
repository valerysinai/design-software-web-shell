import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { REMOTE_DEFINITIONS } from '../src/shell/remote/remote-registry';
import { bootstrapFederation } from '../src/shell/remote/bootstrap-federation';

/**
 * E5 (ADR-009 §11.2): smoke test contra los remotes REALES declarados en el manifest.
 *
 * Alcance real en Node (Vitest/jsdom):
 * - el manifest declara los 9 remotes con URL valida;
 * - `init()` lee el manifest publicado y no deja remotes faltantes;
 * - cada `remoteEntry.js` responde 200 y expone `./App`.
 *
 * Lo que NO se puede verificar aqui: que el `App` remoto monte con React compartido.
 * El `remoteEntry.js` que sirve el dev server de Vite tiene imports relativos a
 * `/node_modules/.vite/deps/...` que el loader ESM de Node no resuelve (y su loader
 * rechaza `http:`). Montarlo requiere un navegador real, no jsdom.
 *
 * Ese montaje en navegador (con `Invalid hook call` como senal de E4) queda para el
 * pipeline de CI, que es lo que E5 pide: un job que levante los remotes y monte la app.
 */
const MANIFEST_ENV = process.env['SMOKE_ENV'] ?? 'develop';
const BASE_URL = process.env['SMOKE_BASE_URL'] ?? 'http://localhost:5000/';

const readManifest = (environment: string): Record<string, string> =>
  JSON.parse(
    readFileSync(join(process.cwd(), 'remotes', `remotes.${environment}.json`), 'utf8'),
  ) as Record<string, string>;

const manifest = readManifest(MANIFEST_ENV);
const declarados = REMOTE_DEFINITIONS.filter((d) => manifest[d.federationName] !== undefined);

const fetchText = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    return response.ok ? await response.text() : null;
  } catch {
    return null;
  }
};

describe.skipIf(declarados.length === 0)('E5 smoke test contra remotes reales', () => {
  it('el manifest declara los 9 remotes con URL terminada en remoteEntry.js', () => {
    expect(declarados).toHaveLength(9);

    for (const definition of REMOTE_DEFINITIONS) {
      const url = manifest[definition.federationName];
      expect(url, `${definition.federationName} sin URL en ${MANIFEST_ENV}`).toBeTruthy();
      expect(url).toMatch(/remoteEntry\.js$/);
    }
  });

  it('init() lee el manifest publicado y no deja remotes faltantes', async () => {
    const result = await bootstrapFederation({ mode: MANIFEST_ENV, basePath: BASE_URL });

    expect(result.manifest.environment).toBe(MANIFEST_ENV);
    expect(result.manifest.source).toBe(`${BASE_URL}remotes.${MANIFEST_ENV}.json`);
    expect(result.manifest.missing).toEqual([]);
    expect(result.initialized).toBe(true);
  }, 30_000);

  it('cada remote accesible responde y declara el modulo ./App', async () => {
    const accesibles: string[] = [];
    const caidos: string[] = [];

    for (const definition of REMOTE_DEFINITIONS) {
      const url = manifest[definition.federationName];
      const source = await fetchText(url);

      if (source === null) {
        caidos.push(definition.federationName);
        continue;
      }

      // El remoteEntry delega en un modulo virtual con el mapa de exposes.
      const exposes = await fetchText(`${new URL('.', url).toString()}@id/virtual:mf-exposes:__mfe_internal__${definition.federationName}__remoteEntry_js`);
      expect(exposes ?? source, `${definition.federationName} no expone modulo`).toBeTruthy();
      expect(`${exposes ?? source}`, `${definition.federationName} no declara './App'`).toContain(
        './App',
      );

      accesibles.push(definition.federationName);
    }

    // Al menos un remote real debe estar arriba: si no, el smoke test no prueba nada.
    expect(
      accesibles.length,
      `Ningun remote responde. Levanta los MFEs (5101-5109). Caidos: ${caidos.join(', ')}`,
    ).toBeGreaterThan(0);
  }, 60_000);
});