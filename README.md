# design-software-web-shell

Host web del frontend federado. Es el único punto de entrada del navegador y el dueño del `BrowserRouter`, la sesión, la navegación por rol, la resolución de remotes y los fallbacks de carga.

## Responsabilidades

- Montar una sola instancia de `BrowserRouter`.
- Resolver rutas comodín por dominio: `/scheduling/*`, `/iam/*`, `/academic-management/*`, etc.
- Cargar remotes con `lazy()` dentro de `Suspense` y `ErrorBoundary`.
- Resolver URLs de remotes desde `remotes.<env>.json`.
- Mostrar la navegación derivada de `GET /auth/me`.
- Mostrar la campana y el panel de notificaciones como chrome global.
- No contener lógica de dominio de los microservicios.

## Rutas

El shell monta el contexto de la aplicación y delega los subárboles de cada dominio a su remote. La definición de rutas compartidas vive en `frontend-platform` o en el contrato de navegación del shell, nunca dentro de un MFE.

## Ambiente

Los archivos `remotes.develop.json`, `remotes.qa.json`, `remotes.staging.json` y `remotes.main.json` se resuelven en runtime. No se hardcodean URLs de `remoteEntry.js` en el código.
