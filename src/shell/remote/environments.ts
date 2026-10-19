export const ENVIRONMENTS = ['develop', 'qa', 'staging', 'main'] as const;
export type AppEnvironment = (typeof ENVIRONMENTS)[number];

export const ENVIRONMENT_PREFIX = 'remotes.';
export const ENVIRONMENT_SUFFIX = '.json';

export const manifestFileFor = (environment: string): string =>
  `${ENVIRONMENT_PREFIX}${environment}${ENVIRONMENT_SUFFIX}`;

export const manifestFileForEnvironment = (mode: string | undefined): string =>
  manifestFileFor(resolveEnvironment(mode));

const isAppEnvironment = (value: string): value is AppEnvironment =>
  (ENVIRONMENTS as readonly string[]).includes(value);

/**
 * Vite y ADR-009 usan nombres distintos para el mismo concepto:
 *
 * | Vite `mode`  | Ambiente (ADR-009) |
 * |--------------|--------------------|
 * | development  | develop            |
 * | production   | main               |
 * | qa           | qa                 |
 * | staging      | staging            |
 *
 * Esta funcion es la unica que traduce entre ambos. Sin ella, `vite build` buscaria
 * `remotes.production.json`, un archivo que no existe en ningun ambiente.
 */
export const resolveEnvironment = (mode: string | undefined): AppEnvironment => {
  if (mode === 'development') return 'develop';
  if (mode === 'production') return 'main';
  if (mode !== undefined && isAppEnvironment(mode)) return mode;
  return 'develop';
};

export const isKnownEnvironment = (value: string): value is AppEnvironment => isAppEnvironment(value);