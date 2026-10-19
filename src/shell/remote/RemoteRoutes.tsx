import { Route, Routes, useLocation } from 'react-router-dom';

import { REMOTE_DEFINITIONS, type RemoteRegistry } from './remote-registry';
import { RemoteBoundary } from './RemoteBoundary';
import { RemoteUnavailable } from '../components/RemoteUnavailable/RemoteUnavailable';
import { RemoteIndex } from '../components/RemoteIndex/RemoteIndex';

export interface RemoteRoutesProps {
  registry: RemoteRegistry;
  manifestSource?: string;
}

interface ShellHttpRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  signal?: AbortSignal;
}

const shellHttpClient = {
  async request<TResponse>({ method, path, query, body, signal }: ShellHttpRequest): Promise<TResponse> {
    const url = new URL(path, window.location.origin);
    Object.entries(query ?? {}).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });

    const response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
      signal,
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (response.status === 204) return undefined as TResponse;
    return response.json() as Promise<TResponse>;
  },
};

const monitoringCatalogs = {
  kpiTypes: [
    { id: 'mock-kpi-attendance', code: 'ATTENDANCE', name: 'Asistencia', description: 'Porcentaje de asistencia de la ficha.', unit: 'PERCENTAGE', is_active: true },
    { id: 'mock-kpi-progress', code: 'CURRICULUM_PROGRESS', name: 'Avance curricular', description: 'Avance frente al plan curricular.', unit: 'PERCENTAGE', is_active: true },
    { id: 'mock-kpi-follow-up', code: 'FOLLOW_UP_COUNT', name: 'Seguimientos realizados', description: 'Cantidad de seguimientos registrados.', unit: 'COUNT', is_active: true },
  ],
  kpiStatuses: [
    { id: 'mock-status-on-track', code: 'ON_TRACK', description: 'En seguimiento', risk_level_id: 'mock-risk-low' },
    { id: 'mock-status-at-risk', code: 'AT_RISK', description: 'En riesgo', risk_level_id: 'mock-risk-medium' },
    { id: 'mock-status-critical', code: 'CRITICAL', description: 'Critico', risk_level_id: 'mock-risk-critical' },
  ],
};

function getRemoteProps(definition: (typeof REMOTE_DEFINITIONS)[number]): Record<string, unknown> {
  if (definition.domain !== 'monitoring') return { basePath: definition.basePath };

  return {
    basePath: definition.basePath,
    httpClient: shellHttpClient,
    catalogs: monitoringCatalogs,
    fichaOptions: [
      { id: 'ficha-2874412', label: '2874412 - Analisis y Desarrollo de Software' },
      { id: 'ficha-3011550', label: '3011550 - Sistemas' },
    ],
    user: {
      instructorId: 'instructor-local',
      capabilities: ['MON_TRACKING_SESSION_CREATE:OWN_FICHAS', 'MON_ALERT_RESOLVE', 'MON_IMPROVEMENT_PLAN_MANAGE'],
    },
  };
}

/**
 * E2 (ADR-009 §10): el shell declara una ruta comodín por dominio y el remote es dueño
 * de su subárbol. El shell no conoce las rutas internas de ningún dominio.
 *
 * Los `<Route>` deben vivir dentro de `<Routes>`; fuera de él React Router no renderiza
 * nada y la pantalla queda en blanco.
 *
 * Cuando el ambiente no declara URLs en `remotes.<env>.json`, los dominios no montan y
 * se muestra `RemoteUnavailable` en vez de una pantalla vacía.
 */
export const RemoteRoutes = ({ registry, manifestSource }: RemoteRoutesProps) => {
  const { pathname } = useLocation();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <RemoteIndex
            currentPath={pathname}
            remotes={REMOTE_DEFINITIONS.map((definition) => ({
              domain: definition.domain,
              federationName: definition.federationName,
              basePath: definition.basePath,
            }))}
            registryKind={registry.kind}
            manifestSource={manifestSource}
          />
        }
      />
      {REMOTE_DEFINITIONS.map((definition) => {
        const Remote = registry.get(definition.domain);
        return (
          <Route
            key={definition.domain}
            path={`${definition.basePath}/*`}
            element={
              <RemoteBoundary domain={definition.domain} resetKey={definition.basePath}>
                <Remote {...getRemoteProps(definition)} />
              </RemoteBoundary>
            }
          />
        );
      })}
      <Route
        path="*"
        element={
          <RemoteUnavailable
            domain="la ruta solicitada"
            reason={
              manifestSource === undefined
                ? undefined
                : `El shell no tiene un remote montado en esta ruta. Manifest activo: ${manifestSource}.`
            }
          />
        }
      />
    </Routes>
  );
};
