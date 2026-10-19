import { describe, expect, it } from 'vitest';
import type { Me } from '@sena/frontend-platform';

import { buildNavigation } from './use-navigation';

/**
 * E2 de HU-001: "solo muestra los módulos/rutas presentes en `me.modules` — no una
 * lista hardcodeada de todos los MFE".
 *
 * Estos tests ya no filtran por rol. La versión anterior cruzaba `me.modules` con
 * una tabla local rol→items, lo que fijaba un catálogo de roles que ninguna HU
 * define y que `iam.yaml` tampoco (roles[].name es string libre).
 */
const me = (overrides: Partial<Me> = {}): Me =>
  ({
    id: '3f6c1a52-0f1a-4a1e-9c1b-2b7a5e4d9c10',
    email: 'usuario@example.invalid',
    full_name: 'Usuario de desarrollo',
    actor_type: 'USER',
    roles: [],
    features: [],
    modules: [],
    ...overrides,
  }) as Me;

describe('E2 navegacion derivada de me.modules', () => {
  it('solo muestra items cuyo modulo esta concedido', () => {
    const items = buildNavigation(me({ modules: ['MOD_DASHBOARD', 'MOD_SCHEDULING'] }), '/');

    // MOD_DASHBOARD -> home. MOD_SCHEDULING -> schedules + las rutas de
    // instructor y aprendiz, que comparten ese módulo.
    expect(items.map((item) => item.id)).toEqual([
      'home',
      'schedules',
      'instructor-schedule',
      'my-schedule',
    ]);
  });

  it('devuelve menu vacio si no hay ningun modulo', () => {
    expect(buildNavigation(me({ modules: [] }), '/')).toEqual([]);
  });

  it('no depende del rol: el mismo module da el mismo menu', () => {
    const sinRol = buildNavigation(me({ modules: ['MOD_SCHEDULING'] }), '/');
    const conRol = buildNavigation(
      me({ modules: ['MOD_SCHEDULING'], roles: [{ name: 'CUALQUIER_COSA', training_center_id: null }] }),
      '/',
    );

    // Un rol desconocido no puede ocultar items concedidos por module.
    expect(sinRol.map((i) => i.id)).toEqual(conRol.map((i) => i.id));
  });

  it('un rol desconocido no oculta lo que me.modules concede', () => {
    // Antes un rol fuera de la tabla (AREA_LEADER, SYSTEM_ADMIN) se quedaba sin
    // menú entero aunque tuviera módulos. E2 dice que manda el módulo.
    const items = buildNavigation(
      me({ modules: ['MOD_SCHEDULING'], roles: [{ name: 'AREA_LEADER', training_center_id: null }] }),
      '/',
    );

    expect(items.map((item) => item.id)).toEqual(['schedules', 'instructor-schedule', 'my-schedule']);
  });

  it('concede todos los items de un modulo concedido', () => {
    const items = buildNavigation(me({ modules: ['MOD_SCHEDULING'] }), '/');

    // MOD_SCHEDULING cubre 'schedules' y las rutas de instructor y aprendiz.
    expect(items.map((item) => item.id).sort()).toEqual(
      ['instructor-schedule', 'my-schedule', 'schedules'].sort(),
    );
  });

  it('agrega items de varios modulos', () => {
    const items = buildNavigation(me({ modules: ['MOD_DOCUMENTS', 'MOD_AUDIT'] }), '/');

    expect(items.map((item) => item.id)).toEqual(['documents', 'templates', 'audit']);
  });

  it('devuelve menu vacio sin sesion', () => {
    expect(buildNavigation(null, '/')).toEqual([]);
  });

  it('marca activo solo el item de la ruta actual', () => {
    const items = buildNavigation(me({ modules: ['MOD_DASHBOARD', 'MOD_SCHEDULING'] }), '/scheduling/horarios');

    expect(items.find((item) => item.id === 'schedules')?.active).toBe(true);
    expect(items.find((item) => item.id === 'home')?.active).toBe(false);
  });

  it('Inicio queda activo solo en la raiz', () => {
    expect(buildNavigation(me({ modules: ['MOD_DASHBOARD'] }), '/').find((i) => i.id === 'home')?.active).toBe(true);
    expect(buildNavigation(me({ modules: ['MOD_DASHBOARD'] }), '/scheduling/horarios').find((i) => i.id === 'home')?.active).toBe(false);
  });

  it('cada item apunta a un remote declarado en el registry', async () => {
    const { REMOTE_DEFINITIONS } = await import('../remote/remote-registry');
    const declarados = new Set(REMOTE_DEFINITIONS.map((d) => d.federationName));

    const items = buildNavigation(
      me({ modules: ['MOD_DASHBOARD', 'MOD_SCHEDULING', 'MOD_ENVIRONMENT', 'MOD_ACADEMIC', 'MOD_ACTORS', 'MOD_MONITORING', 'MOD_IDENTITY', 'MOD_REFERENCE', 'MOD_DOCUMENTS', 'MOD_AUDIT'] }),
      '/',
    );

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(declarados.has(item.remote), `${item.id} apunta a ${item.remote}, que no existe`).toBe(true);
    }
  });
});

describe('regresion: las rutas de navegacion tienen que existir', () => {
  /**
   * Las 15 rutas de `NAVIGATION_TABLE` apuntaban a paths sueltos (`/horarios`,
   * `/fichas`, `/admin/usuarios`) que ningún remote monta: `RemoteRoutes` solo
   * declara `/`, los 9 comodines de dominio y `*`. Todas caían en el comodín y el
   * usuario veía "remote no disponible" con el menú vacío.
   *
   * Este test falla si alguien vuelve a colgar un item de una ruta no montada.
   */
  it('ningun item apunta fuera de los basePath que el shell monta', async () => {
    const { REMOTE_DEFINITIONS } = await import('../remote/remote-registry');
    const { NAVIGATION_TABLE } = await import('./navigation-table');

    const basePaths = REMOTE_DEFINITIONS.map((d) => d.basePath);

    for (const item of NAVIGATION_TABLE) {
      if (item.path === '/') continue;

      const montado = basePaths.some((base) => item.path === base || item.path.startsWith(`${base}/`));
      expect(
        montado,
        `${item.id} apunta a ${item.path}, que no cuelga de ningun basePath montado (${basePaths.join(', ')})`,
      ).toBe(true);
    }
  });

  it('cada item de path absoluto cae en el comodín de SU remote, no en el de otro', async () => {
    const { REMOTE_DEFINITIONS } = await import('../remote/remote-registry');
    const { NAVIGATION_TABLE } = await import('./navigation-table');

    const baseOf = new Map(REMOTE_DEFINITIONS.map((d) => [d.federationName, d.basePath]));

    for (const item of NAVIGATION_TABLE) {
      if (item.path === '/') continue;
      const esperado = baseOf.get(item.remote);
      expect(item.path.startsWith(`${esperado}/`), `${item.id} (${item.remote}) apunta fuera de ${esperado}`).toBe(true);
    }
  });

  it('no hay dos items con el mismo path', async () => {
    const { NAVIGATION_TABLE } = await import('./navigation-table');
    const paths = NAVIGATION_TABLE.map((i) => i.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('no hay dos items con el mismo label visible', async () => {
    // "Mi horario" aparecía dos veces (instructor y aprendiz) porque el filtro
    // por rol los separaba. Ahora ambos items coexisten, así que el copy tiene
    // que distinguirlos.
    const { NAVIGATION_TABLE } = await import('./navigation-table');
    const labels = NAVIGATION_TABLE.map((i) => i.label);
    const duplicados = labels.filter((l, i) => labels.indexOf(l) !== i);
    expect(duplicados).toEqual([]);
  });
});