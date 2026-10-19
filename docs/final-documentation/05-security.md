# 05 — Security

> Purpose: record implemented security controls and limitations.
> Audience: maintainers and operators.
> Snapshot date: 2026-10-19.
> Source snapshot: `SecurityConfig`, `AppProperties`, frontend auth code.
> Status: Verified from source; not penetration-tested.

Spring Security uses OAuth2 login with session cookies. Cookies are HttpOnly, SameSite=Lax, and Secure in production. CSRF uses a readable cookie token repository so the browser can submit the token header. CORS is configured from `CORS_ALLOWED_ORIGINS`.

Public groups include health, OAuth/login, public catalog, mentor, public portfolio, metadata, callbacks, username availability, uploads and client-error reporting. Dev Swagger/mock/dev-seed routes are permitted only outside `prod`; other routes require authentication. Room role checks are enforced through service-level `RoomAccess` and role methods.

Do not store tokens or user data in local/session storage. Current code reads a UI-only `tour_active` sessionStorage flag; auth credentials are cookie-based. Treat that as a documentation-rule inconsistency, not as evidence that credentials are stored there.
