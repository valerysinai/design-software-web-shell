import type { Me } from '@sena/frontend-platform';

/**
 * Sesión mock para desarrollo, sin identidad simulada.
 *
 * ANTES: este archivo traía 5 personas del mockup v2 (María García / COORDINATOR,
 * Juan Pérez / INSTRUCTOR, …) con nombre, correo, rol y features. Eso fijaba en el
 * shell un catálogo de roles que **ninguna de las 8 HUs define** y que `iam.yaml`
 * tampoco: `MeResponse.roles[].name` es `type: string` libre, sin enum.
 *
 * AHORA: una sola sesión genérica. Sin nombre real, sin correo real y **sin roles**.
 * `roles: []` es un valor legítimo del contrato, y hace que la UI no invente la
 * etiqueta de rol mientras no haya datos de `GET /roles`.
 *
 * `modules` sí se mantiene, porque E2 de HU-001 deriva el menú de `me.modules` y
 * sin algún móduloGranted el shell se vería siempre vacío en desarrollo.
 *
 * Los tipos vienen del OpenAPI generado: si el contrato de IAM cambia, este
 * objeto deja de compilar.
 */
export const MOCK_SESSION: Me = {
  id: '00000000-0000-4000-8000-000000000000',
  email: 'usuario@example.invalid',
  // Sin nombre propio: el shell lo muestra en el topbar, así que un nombre real
  // aquí se confundiría con un usuario de verdad.
  full_name: 'Usuario de desarrollo',
  actor_type: 'USER',
  // Sin roles: el contrato lo permite y evita que el shell deduzca permisos de un
  // catálogo que no existe. E2 filtra el menú por `modules`, no por rol.
  roles: [],
  // Sin features: el shell no las consulta. Se declara vacío explícito para que
  // quede claro que nada depende de ellas en esta capa.
  features: [],
  modules: ['MOD_DASHBOARD', 'MOD_SCHEDULING', 'MOD_ACADEMIC', 'MOD_ENVIRONMENT'],
};