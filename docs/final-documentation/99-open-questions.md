# 99 — Open questions

> Purpose: keep unresolved documentation and product questions explicit.
> Audience: maintainers, operators and product owners.
> Snapshot date: 2026-10-19.
> Source snapshot: `_work/04-gaps-and-undocumented.md`.
> Status: Open; none were resolved by runtime execution.

1. Which deployment file/mode is the supported production path?
2. Is `V4_1` intended to run between V4 and V5 under the project’s Flyway parser?
3. Which environment variables are mandatory in production for each optional integration?
4. Are all frontend screens backed by current controllers, or are some demo/mock-only?
5. What are the retention policies for uploads, exports, sessions, events and mail outbox rows?
6. Should non-versioned controller aliases remain public compatibility paths?
7. Is the admin route protected by a server capability check in all environments?
8. Is room API Hub intended for production consumers or development/demo use?
9. Should the generated-client repository rule be implemented, narrowed, or retired?
10. Should the frontend storage rule explicitly permit non-sensitive UI flags such as `tour_active`?
