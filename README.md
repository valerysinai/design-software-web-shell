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

## Integración real de Reference Data: HU-REF-020 y R1

El modo `reference` utiliza `remotes.reference.json`, IAM real y el remote real de Reference Data. Los demás dominios muestran un estado no desplegado. El formulario de entrada del shell usa `AuthClient.login` y `/auth/me`; no utiliza la sesión fija del BFF. La sesión pertenece al host y transmite al remote las features reales y un getter del access token. El token se conserva en sessionStorage hasta cerrar sesión o finalizar la pestaña; no se guardan contraseñas ni refresh tokens. Si el token expira, vuelve a iniciar sesión.

La preparación y las pruebas reproducibles están en `validation/frontend-reference/run.ps1` del repositorio docker-infra, cuya carpeta debe estar en `../docker-infra/design-software-docker-infra`. Abre `http://localhost:5000/reference-data/parametrizacion`. La guía de ese perfil explica las credenciales locales y los seis checks obligatorios (tres backend y tres Chromium), incluido el caos iniciado desde la interfaz.

Para repetir solamente Chromium contra los servicios ya levantados:

```powershell
npm ci
npm exec -- playwright install chromium
npm exec -- playwright test --config playwright.reference.config.ts
```

Las pruebas usan únicamente las credenciales generadas en el archivo local ignorado de R1. No se aceptan skips. No se capturan trazas, videos ni HAR con tokens. Los resultados locales se ignoran en Git. El [ADR de integración](docs/adr/ADR-HU-REF-020-real-frontend-integration.md) explica la separación de responsabilidades y los límites del entorno local. Los checks de tokens CSS consumen el snapshot canónico incluido en design-system, idéntico al documento de origen.
