# 04 — Configuration

> Purpose: enumerate safe configuration boundaries without secrets.
> Audience: contributors and operators.
> Snapshot date: 2026-10-19.
> Source snapshot: `backend/src/main/resources/application.yml` and profile files.
> Status: Verified names/defaults; deployment requirements remain Unverified.

Major variable groups: `SPRING_PROFILES_ACTIVE`, `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`; OAuth `GITHUB_*`/`GOOGLE_*`; app URLs and limits `APP_*`; `CORS_ALLOWED_ORIGINS`; mail `MAIL_*`; GitHub/Canva credentials; AI `AI_*`, legacy `GROQ_*`, and STT variables; `APP_ENCRYPTION_KEY`; `ADMIN_EMAILS`; `COOKIE_*`.

Safe observed defaults include backend `8080`, frontend `5173`, local database `hackathon_os`, AI enabled, 45-second AI timeout, two retries, global AI concurrency four and user rate ten/minute. Treat encryption, OAuth secrets, database passwords, mail passwords, provider keys and integration secrets as mandatory only when their feature is enabled; exact production requirements are an open question.
