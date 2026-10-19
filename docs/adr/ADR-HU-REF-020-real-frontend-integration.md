# ADR: Real Reference Data frontend integration for HU-REF-020 and R1

Status: implemented; subject to PR review.

## Context

The imported shell supports remote federation, but the Reference Data remote was receiving no user features or token provider. Its HTTP adapter therefore could not call protected endpoints with the IAM bearer token. The downloaded BFF returns a fixed local identity and cannot prove real authentication. HU-REF-020 backend tests and R1 broker tests alone do not demonstrate the domain inside web-shell as required by the improvement plan, section 6.

## Decision

- Keep session ownership in web-shell and authentication HTTP calls in frontend-platform. Add `AuthClient.login` using the existing IAM contract and a writable token-provider port. Save only the access token in the shell's existing sessionStorage slot. Do not persist the password or refresh token, and clear the access token on logout or failed identity lookup.
- Provide a shell login entry for environments without a deployed IAM remote. The form submits to real IAM and loads `/auth/me`; it never fabricates users, roles or features. This does not implement IAM administration or claim authorship of the IAM service.
- Pass `/auth/me` features and a current-token getter to the Reference Data remote. Normalize feature suffixes only for UI visibility; backend signature, expiry and feature validation remain authoritative. This does not add resource-scope filtering.
- Reuse the existing Reference Data HTTP adapter. It asks the injected getter for a current bearer token on each request; it does not read browser storage. Its provider is scoped to the single mounted remote and removed on unmount. Multiple simultaneous instances with different sessions would require a per-instance client instead.
- Add a `reference` federation manifest containing the real Reference Data remote. Unconfigured domains display an unavailable state, not mock business data. Other environment manifests remain available.
- Route same-origin browser requests through Vite's local integration proxy. IAM keeps `/api/v1/auth`; Reference Data's gateway prefix `/reference-api/api/v1` is stripped because its service routes are rooted at `/parameters`, `/catalogs`, etc. These are local development proxies, not a production edge implementation.
- Package the shell and remote in the `frontend-reference` Docker Compose profile, extending the real R1 validation stack. Publish only loopback ports, copy sources into disposable container build directories and retain existing secret generation in ignored `.env` files.
- Use the canonical CSS snapshot shipped by design-system for the existing shell token checks, removing the test-only dependency on a separate docs checkout.

## Verification

Run `validation/frontend-reference/run.ps1` in docker-infra. Three mandatory backend integration tests cover real JWT claims/security, transactional rollback, atomic inbox/deduplication and 1/2/4-second retry/DLQ/replay. Three Chromium scenarios cover parameter create/update/reload/logout, learner 403 and missing/invalid JWT 401, and catalog writes across actual RabbitMQ outage and service restart. The last scenario deliberately republishes two persisted events with unchanged identities and waits for a FIFO fence before checking two inbox rows and two effects.

## Consequences and boundaries

No backend permission check is relaxed. UI visibility is not a security boundary. R1 remains a backend mechanism: the UI starts real business writes, while PostgreSQL/outbox/inbox and broker evidence establish recovery and deduplication. No RabbitMQ management screen or replay control is added to the business UI.

The local profile covers Reference Data, IAM and their supporting services. Other domains are not deployed or claimed as validated. The BFF and design-system source remain unchanged. Automatic token refresh is not added by this change; an expired session requires a new login. Browser traces, video and HAR recording are disabled to avoid retaining credentials or bearer tokens. Screenshots contain only test fixtures and generated business identifiers.
