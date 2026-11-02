# WORKING RULES

1. Verify before changing: confirm every audit claim in real code; if the audit is wrong, skip it and note it in the change report.
2. Never edit an existing Flyway migration. New schema changes only as new migration files with the next free version number (check the highest existing one, note the unusual V4_1 file). Migrations must be idempotent where possible (IF NOT EXISTS) and safe on a populated database.
3. Keep every existing API URL, HTTP method and response JSON shape backward compatible unless the step explicitly says otherwise. Adding optional fields is fine.
4. Work in small increments. After each increment run: backend compile + tests (./mvnw -q test from backend/), frontend typecheck + build + unit tests (from frontend/). Fix failures before moving on. Never leave the build red.
5. No secrets in code or docs. Any new configuration is an environment variable with a safe default, and must be added to .env.example and render-env.template (or equivalent) with a one-line description.
6. Do not make unrelated refactors. Do not delete code unless the step says so.
7. Do not stop to ask questions. When something is ambiguous, choose the safest reasonable option and record it under "Decisions" in the change report.
8. At the end of every step, write docs/changes/STEP_<n>_<name>.md with these sections: (a) Plain-language summary written for a non-technical reader (max 10 lines: what was wrong, what is better now, what users will notice); (b) Files changed (grouped); (c) New environment variables; (d) How to verify manually (numbered click-by-click steps); (e) Rollback notes; (f) Decisions and assumptions; (g) Remaining risks / follow-ups; (h) Things the human owner must do outside the code (Render dashboard, OAuth consoles, etc.).
9. Final chat reply after each step: only the path of the change report and a 5-line summary.

