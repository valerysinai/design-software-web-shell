import { expect, test, type Page } from '@playwright/test';

/**
 * E5 (ADR-009 §11.2): smoke test en navegador contra los remotes REALES.
 *
 * E1 y E3 se cubren en Vitest. Lo que solo se puede verificar aqui es E4: que el
 * `App` de un remote monta usando el React compartido por el host. Si cada remote
 * trajera su propia copia de React, React lanzaria "Invalid hook call" al renderizar,
 * que es exactamente el sintoma que E4 previene.
 *
 * Regla de este archivo: un remote CAIDO es un resultado valido (muestra
 * `RemoteUnavailable`, que es E3). Un remote ARRIBA que monta vacio o rompe es un fallo.
 */

const REMOTES = [
  { name: 'iamMfe', basePath: '/iam' },
  { name: 'schedulingMfe', basePath: '/scheduling' },
  { name: 'academicManagementMfe', basePath: '/academic-management' },
  { name: 'trainingEnvironmentMfe', basePath: '/training-environment' },
  { name: 'referenceDataMfe', basePath: '/reference-data' },
  { name: 'actorsMfe', basePath: '/actors' },
  { name: 'documentMfe', basePath: '/document' },
  { name: 'monitoringMfe', basePath: '/monitoring' },
  { name: 'auditMfe', basePath: '/audit' },
] as const;

const INVALID_HOOK_CALL = /Invalid hook call/i;

/**
 * Espera a que la ruta resuelva a un desenlace conocido: `RemoteUnavailable` (E3) o
 * contenido real del remote. Sin esto el test pasaria contra la pantalla de carga.
 */
const waitForRemoteOutcome = async (page: Page): Promise<void> => {
  await page.waitForFunction(
    () => {
      const root = document.querySelector('#root');
      if (root === null || root.innerHTML.trim().length === 0) return false;
      const main = document.querySelector('#main-content');
      if (main === null) return false;
      const text = main.textContent ?? '';
      const caido = text.includes('No pudimos cargar');
      const montado = main.querySelector('h1, h2, h3') !== null && text.trim().length > 0;
      return caido || montado;
    },
    undefined,
    { timeout: 30_000 },
  );
};

test.describe('E5 remotes reales en navegador', () => {
  test('ningun remote monta con una copia propia de React (E4)', async ({ page }) => {
    const duplicados: string[] = [];
    page.on('pageerror', (error) => {
      if (INVALID_HOOK_CALL.test(error.message)) duplicados.push(error.message);
    });

    const montados: string[] = [];
    const caidos: string[] = [];

    for (const remote of REMOTES) {
      await page.goto(`${remote.basePath}/`);
      await waitForRemoteOutcome(page);

      const caido = (await page.getByRole('alert').count()) > 0;
      (caido ? caidos : montados).push(remote.name);
    }

    // E4: si React estuviera duplicado, habria lanzado en el primer remote que monta.
    expect(duplicados, 'React duplicado entre host y remote').toEqual([]);

    // E3: ningun camino puede dejar el arbol de React vacio.
    for (const remote of REMOTES) {
      await page.goto(`${remote.basePath}/`);
      const vacio = await page.evaluate(() => {
        const root = document.querySelector('#root');
        return root === null || root.innerHTML.trim().length === 0;
      });
      expect(vacio, `${remote.name} dejo la pantalla en blanco`).toBe(false);
    }

    test.info().annotations.push({
      type: 'remotes',
      description:
        `montados: ${montados.join(', ') || 'ninguno'} | caidos: ${caidos.join(', ') || 'ninguno'}`,
    });
  });

  test('la portada lista los 9 dominios y navega a uno', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Remotes del shell/i })).toBeVisible();

    for (const remote of REMOTES) {
      await expect(page.getByRole('button', { name: new RegExp(remote.name, 'i') })).toBeVisible();
    }

    // Navegar debe cambiar la ruta sin recargar la pagina (router compartido, HU-SHELL-003 E2).
    await page.getByRole('button', { name: new RegExp(REMOTES[0].name, 'i') }).click();
    await page.waitForURL((url) => url.pathname.startsWith(REMOTES[0].basePath));
  });

  test('un remote inalcanzable muestra RemoteUnavailable y no pantalla en blanco', async ({ page }) => {
    // Ruta que ningun remote monta: debe caer en el `*` de RemoteRoutes.
    await page.goto('/ruta-que-no-existe');

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/No pudimos cargar/i);

    // El shell (barra superior) sigue vivo: un fallo no tumba la aplicacion.
    await expect(page.getByRole('banner')).toBeVisible();
  });
});