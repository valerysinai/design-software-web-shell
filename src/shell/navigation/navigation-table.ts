export type RemoteName =
  | 'iamMfe'
  | 'schedulingMfe'
  | 'academicManagementMfe'
  | 'trainingEnvironmentMfe'
  | 'referenceDataMfe'
  | 'actorsMfe'
  | 'documentMfe'
  | 'monitoringMfe'
  | 'auditMfe';

export type NavIcon =
  | 'home'
  | 'calendar'
  | 'clock'
  | 'folder'
  | 'bell'
  | 'activity'
  | 'chart'
  | 'users'
  | 'file'
  | 'settings'
  | 'edit';

/**
 * ⚠️ Este archivo NO define roles.
 *
 * Ninguna de las 8 HUs del shell nombra un rol concreto, y `iam.yaml` tampoco:
 * `MeResponse.roles[].name` es `type: string` libre, sin enum. El catálogo real
 * de roles se sirve por `GET /roles` (con `display_name`), no desde aquí.
 *
 * HU-001 E2 fija el criterio: el menú se deriva de `me.modules`, no de una lista
 * de roles. Por eso esta tabla solo declara *qué item existe* y *a qué módulo
 * pertenece*; el filtrado por permisos vive en `use-navigation.ts`.
 */

export interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly icon: NavIcon;
  readonly module: string;
  readonly remote: RemoteName;
}

/**
 * Tabla de items de navegación.
 *
 * ⚠️ `path` SIEMPRE cuelga del `basePath` que el shell monta para el remote
 * (ver `remote-registry.ts`). Antes apuntaban a paths sueltos (`/horarios`,
 * `/fichas`) que ningún remote monta, así que todas caían en el comodín `*` de
 * `RemoteRoutes` y el usuario veía "remote no disponible" con el menú vacío.
 *
 * El remote es dueño de su subárbol (ADR-009 §8): el shell no sabe las rutas
 * internas de ningún dominio, solo el prefijo que le monta.
 */
export const NAVIGATION_TABLE: readonly NavItem[] = [
  { id: 'home', label: 'Inicio', path: '/', icon: 'home', module: 'MOD_DASHBOARD', remote: 'schedulingMfe' },
  { id: 'schedules', label: 'Horarios', path: '/scheduling/horarios', icon: 'calendar', module: 'MOD_SCHEDULING', remote: 'schedulingMfe' },
  { id: 'availability', label: 'Disponibilidad', path: '/training-environment/disponibilidad', icon: 'clock', module: 'MOD_ENVIRONMENT', remote: 'trainingEnvironmentMfe' },
  { id: 'fichas', label: 'Fichas', path: '/academic-management/fichas', icon: 'folder', module: 'MOD_ACADEMIC', remote: 'academicManagementMfe' },
  { id: 'instructor-schedule', label: 'Mi horario (instructor)', path: '/scheduling/mi-horario', icon: 'calendar', module: 'MOD_SCHEDULING', remote: 'schedulingMfe' },
  { id: 'instructor-availability', label: 'Mi disponibilidad (instructor)', path: '/actors/mi-disponibilidad', icon: 'clock', module: 'MOD_ACTORS', remote: 'actorsMfe' },
  { id: 'tracking', label: 'Seguimiento', path: '/monitoring/seguimiento', icon: 'activity', module: 'MOD_MONITORING', remote: 'monitoringMfe' },
  { id: 'my-schedule', label: 'Mi horario', path: '/scheduling/mi-horario-aprendiz', icon: 'calendar', module: 'MOD_SCHEDULING', remote: 'schedulingMfe' },
  { id: 'notifications', label: 'Notificaciones', path: '/monitoring/notificaciones', icon: 'bell', module: 'MOD_MONITORING', remote: 'monitoringMfe' },
  { id: 'indicators', label: 'Indicadores', path: '/monitoring/indicadores', icon: 'chart', module: 'MOD_MONITORING', remote: 'monitoringMfe' },
  { id: 'users', label: 'Usuarios', path: '/iam/usuarios', icon: 'users', module: 'MOD_IDENTITY', remote: 'iamMfe' },
  { id: 'reference-data', label: 'Datos de referencia', path: '/reference-data/datos-referencia', icon: 'file', module: 'MOD_REFERENCE', remote: 'referenceDataMfe' },
  { id: 'documents', label: 'Documentos', path: '/document/documentos', icon: 'file', module: 'MOD_DOCUMENTS', remote: 'documentMfe' },
  { id: 'templates', label: 'Plantillas', path: '/document/documentos/plantillas', icon: 'edit', module: 'MOD_DOCUMENTS', remote: 'documentMfe' },
  { id: 'audit', label: 'Auditoría', path: '/audit/auditoria', icon: 'activity', module: 'MOD_AUDIT', remote: 'auditMfe' },
  { id: 'parameters', label: 'Parametrización', path: '/reference-data/parametrizacion', icon: 'settings', module: 'MOD_REFERENCE', remote: 'referenceDataMfe' },
];

/**
 * Sin etiqueta de rol local.
 *
 * La versión anterior traía un `Record<string, string>` con copy de los 5 roles
 * (`COORDINATOR: 'Coordinador Académico'`, …) copiado del mockup v2. Eso fijaba
 * en el frontend un catálogo que ningún contrato define, y `roleLabelOf` además
 * filtraba el menú por rol, contradiciendo HU-001 E2.
 *
 * Para mostrar el nombre del rol hay que pedirlo al backend: `GET /roles` devuelve
 * `display_name` para cada `Role`. Ese endpoint requiere el feature
 * `IDENTITY_ROLE_VIEW`, así que no puede ser una llamada incondicional del shell.
 */