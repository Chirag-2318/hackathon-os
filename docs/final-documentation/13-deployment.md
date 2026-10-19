# 13 — Deployment and operations

> Purpose: map deployment assets and known operational boundaries.
> Audience: operators and maintainers.
> Snapshot date: 2026-10-19.
> Source snapshot: `deploy/`, Compose, Dockerfiles and Nginx/Caddy files.
> Status: File inventory; deployment was not run.

Deployment assets include root development Compose, `deploy/docker-compose.prod.yml`, backend/frontend Dockerfiles, Caddy and Nginx configuration, VM setup/update/rollback/backup scripts, and database restore guidance. The supported production path is not uniquely resolved because several modes are present.

Use `backend/pom.xml` as authoritative for current backend version (Spring Boot 4.1.1, Java 25). Do not copy the older Spring Boot 3.4 diagram from deployment prose without labeling it stale. Production disables Swagger/API docs and exposes health probes only.
