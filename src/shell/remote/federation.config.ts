export const FEDERATION_HOST_NAME = 'webShell';

/**
 * E4: `react`, `react-dom` y `react-router-dom` deben ser singletons. Sin esto el host
 * y cada remote cargan su propia copia de React y falla con "Invalid hook call".
 *
 * `requiredVersion` coincide con el declarado en los 9 MFE.
 */
export const SHARED_SINGLETONS = {
  react: { singleton: true, requiredVersion: '^18.3.1' },
  'react-dom': { singleton: true, requiredVersion: '^18.3.1' },
  'react-router-dom': { singleton: true, requiredVersion: '^6.30.1' },
} as const;