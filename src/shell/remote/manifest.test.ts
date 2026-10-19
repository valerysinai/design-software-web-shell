import { describe, expect, it, vi } from 'vitest';

import { loadRemoteManifest, manifestFileFor, validateManifest } from './manifest';

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('E2 resolucion por ambiente', () => {
  it('deriva el nombre del manifest a partir del modo', () => {
    expect(manifestFileFor('develop')).toBe('remotes.develop.json');
    expect(manifestFileFor('qa')).toBe('remotes.qa.json');
    expect(manifestFileFor('staging')).toBe('remotes.staging.json');
    expect(manifestFileFor('main')).toBe('remotes.main.json');
  });

  it('lee el manifest del ambiente activo desde la ruta base', async () => {
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      calls.push(url);
      return jsonResponse(200, { iamMfe: 'http://localhost:5101/remoteEntry.js' });
    });

    await loadRemoteManifest({ mode: 'develop', basePath: '/', fetchImpl: fetchImpl as unknown as typeof fetch });

    expect(calls).toEqual(['/remotes.develop.json']);
  });

  it('reporta cuando un ambiente no declara ninguna URL', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, {}));

    const loaded = await loadRemoteManifest({
      mode: 'qa',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(loaded.isEmpty).toBe(true);
    expect(loaded.missing).toContain('iamMfe');
    expect(loaded.missing).toHaveLength(9);
  });

  it('propaga el error si el manifest no existe', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(404, null));

    await expect(
      loadRemoteManifest({ mode: 'main', fetchImpl: fetchImpl as unknown as typeof fetch }),
    ).rejects.toThrow(/HTTP 404/);
  });
});

describe('validacion del manifest', () => {
  it('rechaza un manifest que no sea objeto', () => {
    expect(() => validateManifest([])).toThrow(/debe ser un objeto/);
    expect(() => validateManifest(null)).toThrow(/debe ser un objeto/);
  });

  it('rechaza URLs que no terminan en remoteEntry.js', () => {
    expect(() => validateManifest({ iamMfe: 'http://localhost:5101/' })).toThrow(/remoteEntry\.js/);
  });

  it('ignora entradas vacias en lugar de aceptarlas como validas', () => {
    const { manifest, missing } = validateManifest({ iamMfe: 'http://localhost:5101/remoteEntry.js', auditMfe: '' });

    expect(Object.keys(manifest)).toEqual(['iamMfe']);
    expect(missing).toContain('auditMfe');
  });

  it('acepta un manifest completo y no reporta faltantes', () => {
    const complete = {
      iamMfe: 'http://localhost:5101/remoteEntry.js',
      schedulingMfe: 'http://localhost:5102/remoteEntry.js',
      academicManagementMfe: 'http://localhost:5103/remoteEntry.js',
      trainingEnvironmentMfe: 'http://localhost:5104/remoteEntry.js',
      referenceDataMfe: 'http://localhost:5105/remoteEntry.js',
      actorsMfe: 'http://localhost:5106/remoteEntry.js',
      documentMfe: 'http://localhost:5107/remoteEntry.js',
      monitoringMfe: 'http://localhost:5108/remoteEntry.js',
      auditMfe: 'http://localhost:5109/remoteEntry.js',
    };

    const { manifest, missing } = validateManifest(complete);

    expect(missing).toHaveLength(0);
    expect(Object.keys(manifest)).toHaveLength(9);
  });
});