# 12 — Testing and verification

> Purpose: describe available checks and the evidence boundary.
> Audience: contributors and reviewers.
> Snapshot date: 2026-10-19.
> Source snapshot: Maven tests, Vitest and Playwright configuration.
> Status: Inventory only; no checks run during this documentation task.

Backend tests live under `backend/src/test`. Frontend unit tests use Vitest; browser tests use Playwright configuration under `frontend/e2e` and root `e2e`. MSW fixtures and plan validator samples are present. `docs/SMOKE_CHECKLIST.md` is a manual checklist, not a passing test receipt.

No statement in this documentation set means “build passes,” “tests pass,” “migrations apply,” or “production is healthy” unless a future run records the command and result.
