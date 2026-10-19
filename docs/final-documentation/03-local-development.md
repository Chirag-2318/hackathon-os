# 03 — Local development

> Purpose: safe local setup reference.
> Audience: contributors.
> Snapshot date: 2026-10-19.
> Source snapshot: root Compose, backend/frontend manifests and YAML.
> Status: Verified configuration; commands not executed.

The backend defaults to port `8080`, the frontend commonly serves on `5173`, and the application datasource default is host PostgreSQL port `5433`. Root Compose may publish a different host port; keep host and container ports separate.

Use the repository’s existing Maven, npm, Compose and script instructions after reviewing `README.md`, `docs/RUNBOOK.md`, and the relevant Compose file. This documentation task intentionally did not execute setup commands.

Required local prerequisites and exact commands are intentionally delegated to the repository runbook because they may vary by profile. Do not copy development credentials into production.
