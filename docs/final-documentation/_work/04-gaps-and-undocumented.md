# Phase 4 — Gaps and undocumented behavior

> Status: derived from the completed inventory and targeted source inspection. “Gap” means absent, ambiguous, stale, or not proven by the repository; it does not mean the feature is necessarily broken.

## High-priority documentation gaps

| Gap | Evidence | Required treatment |
|---|---|---|
| No checked-in canonical OpenAPI file | Springdoc configuration exists, but inventory found no YAML/JSON specification | Link runtime `/v3/api-docs` for non-production and room API Hub output; do not claim a repository spec. |
| Full endpoint/DTO catalogue is not maintained | 57 controllers and many DTO packages exist; existing coverage is an audit artifact | Group the final API reference by controller and link source classes. Mark the coverage count as audit evidence, not runtime evidence. |
| Flyway ordering has `V4_1` alongside V4 and V10+ | Migration filenames | Record exact filenames and mark clean-apply behavior `UNVERIFIED` without running Flyway. |
| Production deployment mode/version needs a single source | Compose, Caddy, Nginx and deployment docs coexist | Document observed files separately and mark any diagram/version mismatch. |
| Required environment variables are not fully classified | YAML defaults, `.env.example`, `@ConfigurationProperties`, and integration classes are distributed | Provide a safe variable-name table with required/optional/feature-dependent status; never copy values. |
| Entity/schema reconciliation is not complete | Many JPA entities and 41 migrations | Use migration names plus entity package map; avoid asserting every column/constraint until compared. |

## Product-status ambiguities

- `[brackit]` is current public copy in code/config; “Bracket” is the documentation/project name requested by the user. Code identifiers remain `hackathonos`.
- Current planning is four steps; five-step wording is historical.
- Current PRESENT navigation is deck, pitch kit, submission, with legacy redirects; older separate pitch/demo/rehearse/Q&A routes should not be listed as canonical.
- Pricing/billing captures plan interest and configuration; live payment checkout was not proven (`paymentsEnabled: false` was observed).
- External Devpost or other portal submission automation was not proven. The implemented submission flow is local checklist/state management unless a controller proves otherwise.
- AI generation is implemented through a backend gateway, but that is not evidence of machine-learning functionality. Do not use ML terminology.
- Six-ring marketing/design language conflicts with the seven-category backend readiness calculator. The final docs must distinguish presentation copy from backend truth.

## Security and operations gaps

- Session/CSRF/CORS behavior is source-documented, but no browser or deployment verification was run.
- `APP_ENCRYPTION_KEY` is configured as an environment-backed property and is security-sensitive; examples must use placeholders only.
- Development defaults include dummy OAuth client IDs and local database credentials. These are safe defaults only for local development and must not be presented as production credentials.
- Uploads are served from `/uploads/**`; retention, size policy, and storage durability need deployment-specific confirmation.
- Scheduled jobs run in-process; the documentation should note that multi-instance deployment may require job coordination or idempotence review where applicable.
- Mail can be disabled/dry-run; actual SMTP delivery was not tested.

## Implementation/documentation inconsistencies to preserve as known issues

1. Repository guidance requires a generated client, but current frontend code contains hand-written wrappers and direct fetches.
2. Frontend guidance says no user data in sessionStorage, while the router stores a UI-only `tour_active` flag. This is not an auth-token leak, but the wording should be narrowed.
3. Existing documents use both PostgreSQL host ports 5432 and 5433. Code defaults to 5433; Compose/container mappings must be stated explicitly.
4. The frontend contains historical or fixture text with unrelated transit/ML examples. These are not Bracket product capabilities.
5. Some route components are explicit placeholders (`/terms`, `/privacy`) and should not be described as completed policy pages.

## Open questions to carry into `99-open-questions.md`

- Which deployment file is the supported production path: `deploy/docker-compose.prod.yml`, root Compose, or another hosting mode?
- Is `V4_1` intended to run between V4 and V5 under the project’s Flyway version parser?
- Which exact environment variables are mandatory in production for OAuth, encryption, database, mail, AI, GitHub, Canva, CORS and admin access?
- Are all current frontend screens backed by the listed backend controllers, or do any remain mocked/demo-only?
- What is the supported retention policy for uploads, exports, sessions, events and mail outbox rows?
- Should non-versioned endpoint aliases remain supported, or are they compatibility-only?
- Is the `admin` frontend route server-authorized solely by backend responses, or should a client-side capability gate be documented?
- Is the room API Hub intended for production consumers, or only for development/demo use?
