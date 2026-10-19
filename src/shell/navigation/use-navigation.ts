import { useMemo } from 'react';
import type { Me } from '@sena/frontend-platform';

import { NAVIGATION_TABLE, type NavItem } from './navigation-table';

export interface NavigationItem extends NavItem {
  readonly active: boolean;
}

const isCurrentPath = (itemPath: string, currentPath: string): boolean =>
  itemPath === '/' ? currentPath === '/' : currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);

/**
 * E2 (HU-001): el menú se deriva de `me.modules`, la lista de módulos que el
 * backend calculó para este usuario.
 *
 * Antes este filtro cruzaba `me.modules` con un `ROLE_TO_NAV_IDS` local, lo que
 * además de contradecir E2 dependía de un catálogo de roles que ningún contrato
 * define. Con el cruce, un usuario con `MOD_SCHEDULING` perdía "Horarios" si su
 * rol no estaba en la tabla, aunque el módulo sí estuviera concedido.
 */
export const buildNavigation = (me: Me | null, currentPath: string): readonly NavigationItem[] => {
  if (me === null) return [];

  const grantedModules = new Set(me.modules);

  return NAVIGATION_TABLE.filter((item) => grantedModules.has(item.module)).map((item) => ({
    ...item,
    active: isCurrentPath(item.path, currentPath),
  }));
};

export interface UseNavigationResult {
  items: readonly NavigationItem[];
  isEmpty: boolean;
}

export const useNavigation = (me: Me | null, currentPath: string): UseNavigationResult => {
  const items = useMemo(() => buildNavigation(me, currentPath), [me, currentPath]);
  return { items, isEmpty: items.length === 0 };
};