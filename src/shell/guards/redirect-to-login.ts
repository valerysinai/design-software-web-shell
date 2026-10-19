import type { SessionDataSource } from '../../app/data-source/session-data-source';

export const LOGIN_REMOTE = 'iamMfe';
export const LOGIN_PATH = '/login';

/**
 * E3: visitante sin token valido no debe ver el shell vacio.
 * HU-SHELL-003 extraera este guard a `RequireSession` sobre el router compartido.
 */
export const redirectToLogin = (dataSource: SessionDataSource, currentPath: string): string =>
  dataSource.hasSession() ? currentPath : LOGIN_PATH;