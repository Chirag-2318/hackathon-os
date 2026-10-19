# 11 — Live updates and jobs

> Purpose: explain real-time behavior and scheduled work.
> Audience: maintainers and operators.
> Snapshot date: 2026-10-19.
> Source snapshot: `events`, `design/live.tsx`, scheduled services.
> Status: Verified source; operational timing not measured.

Room and notification updates use Spring MVC `SseEmitter`, an in-memory `RoomEventHub`, event IDs and replay/resync support. Backend keepalive scheduling is approximately 25 seconds. Frontend reconnects with 1/2/4-second exponential backoff up to 30 seconds and falls back to 30-second polling after repeated failures.

Scheduled areas include cleanup/data retention, rate-limit cleanup, GitHub sync, deadline/email reminders, mail delivery, notification cleanup and submission-link checks. Jobs are in-process; multi-instance coordination is not documented as solved.
