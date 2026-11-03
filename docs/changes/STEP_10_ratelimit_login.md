# Step 10: Rate Limiting Resolution, Login Session Resilience, and Scheduled Cleanup Fix

## (a) Plain-Language Summary
Production visitors experienced immediate "Too many requests. Please slow down and try again" errors on the sign-in page, and background database cleanup jobs were failing with SQL syntax errors. Investigation revealed two root causes:
1. Because traffic flows from browsers through Vercel's proxy before reaching Render, the backend was rate-limiting requests based on the direct connection socket IP (Vercel's proxy address) and rightmost proxy header rather than the actual visitor IP (`x-vercel-forwarded-for`). All visitors globally shared a single 60 request/minute unauthenticated bucket, which was instantly exhausted by frontend retries on login page load.
2. The scheduled cleanup job was failing with `bad SQL grammar [DELETE FROM idempotency_keys WHERE created_at < ?]` because PostgreSQL JDBC cannot infer SQL types for raw `java.time.Instant` parameters in JdbcClient updates, throwing `PSQLException`.

Now, the client IP resolver extracts valid IP literals from `x-vercel-forwarded-for` (with fallback to leftmost client hop), unauthenticated rate limits are tunable and set to 120/min with a dedicated 300/min cap for public health and capacity endpoints, OAuth flows are strictly exempt, all cleanup SQL parameters use explicit timestamps, and the frontend caches public configurations and limits retries. Visitors can now seamlessly sign in without spurious 429 toast alerts.

---

## (b) Files Changed

### Backend Core & Security
- `backend/src/main/java/com/hackathonos/backend/common/security/ClientIpResolver.java`:
  - Resolved real visitor IP from `x-vercel-forwarded-for` (or leftmost client IP from `X-Forwarded-For`).
  - Strict validation of IPv4 and IPv6 literals (`InetAddress.ofLiteral`), discarding invalid hostnames or forged injection strings.
  - Required matching `x-proxy-secret` header when `PROXY_SHARED_SECRET` is configured.
- `backend/src/main/java/com/hackathonos/backend/common/security/RateLimitInterceptor.java`:
  - Removed socket peer address limiting (`global:unauth:peer:`) that falsely grouped all visitors behind reverse proxies into one bucket.
  - Exempted OAuth authorization and callback endpoints (`/oauth2/authorization/**`, `/login/oauth2/code/**`) from interceptor rate limiting.
  - Granted `/api/v1/health*`, `/api/v1/me`, `/api/v1/public/config`, and `/api/v1/public/capacity` their own generous 300/min per-IP cap.
  - Added tunable unauthenticated limit (`RATE_LIMIT_UNAUTH_PER_MINUTE`, default 120/min) and authenticated limit (`RATE_LIMIT_AUTH_PER_MINUTE`, default 600/min).
  - Ensured `Retry-After` header is included on all 429 responses.
  - Throttled rate limit warnings in server logs to at most 1 line per key/path per minute, masking IP literals (e.g., `203.0.***.***` or `user:xxxxxxxx-***`).
- `backend/src/main/java/com/hackathonos/backend/common/config/AppProperties.java`:
  - Added `RateLimitProperties` binding `app.rate-limit.unauth-per-minute` and `app.rate-limit.auth-per-minute`.
- `backend/src/main/resources/application.yml` & `application-prod.yml`:
  - Added configuration keys for `RATE_LIMIT_UNAUTH_PER_MINUTE` and `RATE_LIMIT_AUTH_PER_MINUTE`.

### Backend Jobs, Cleanup & Persistence
- `backend/src/main/resources/db/migration/V48__ensure_idempotency_keys_and_cleanup.sql`:
  - Added idempotent migration ensuring `idempotency_keys` table and associated indexes exist across all production and test environments.
- `backend/src/main/java/com/hackathonos/backend/common/jobs/CleanupJob.java`:
  - Fixed parameter type binding: converted all `Instant` parameters to `java.sql.Timestamp.from(...)` for PostgreSQL JDBC driver compatibility.
- `backend/src/main/java/com/hackathonos/backend/common/idempotency/IdempotencyService.java`:
  - Converted cutoff `Instant` parameter to `java.sql.Timestamp.from(cutoff)` in DB queries.
- `backend/src/main/java/com/hackathonos/backend/common/lock/DbAdvisoryLockService.java`:
  - Enhanced error logging under advisory locks to include full exception class, message, and stack trace.
- `backend/src/main/java/com/hackathonos/backend/reminders/DeadlineReminderJob.java`:
  - Reassigned lock ID to `1010L` to resolve lock key collision with `CleanupJob.doRealtimePrune` (`1005L`).
- `backend/src/main/java/com/hackathonos/backend/submission/SubmissionLinkCheckJob.java`:
  - Reassigned lock ID to `1011L` to resolve lock key collision with `CleanupJob.doIdempotencyPrune` (`1006L`).

### Backend Tests
- `backend/src/test/java/com/hackathonos/backend/common/security/ClientIpResolverTest.java`:
  - Added unit tests proving correct client IP extraction behind Vercel headers, leftmost XFF handling, IPv6 literal support, and rejection of non-IP strings.
- `backend/src/test/java/com/hackathonos/backend/common/security/RateLimitInterceptorIntegrationTest.java`:
  - Verified 150 unauthenticated requests from 150 distinct `x-vercel-forwarded-for` IPs are not throttled.
  - Verified 130 requests from a single IP to non-exempt endpoint throttle after 120 with HTTP 429 and `Retry-After`.
  - Verified OAuth paths are never throttled.
  - Verified exempt endpoints allow > 120 calls within generous 300/min cap.
- `backend/src/test/java/com/hackathonos/backend/common/jobs/ScheduledCleanupJobsIntegrationTest.java`:
  - Verified every scheduled cleanup and prune method executes against migrated schema without SQL errors.

### Frontend
- `frontend/src/App.tsx`:
  - Configured React Query `defaultOptions.queries.retry`: will NOT retry on 400, 401, 403, 404, or 429.
  - Retries only network errors and 5xx responses (maximum 2 retries) with exponential backoff plus random jitter.
  - Set `refetchOnWindowFocus: false` to eliminate refetch storms.
  - Suppressed duplicate generic toasts on 429 errors in `queryCache.onError`.
- `frontend/src/design/api.ts`:
  - Added `showThrottled429Toast`: throttled to at most 1 toast per 10 seconds, displaying `Retry-After` seconds when present.
  - Ensured `apiFetch` does not auto-retry on HTTP 429.
- `frontend/src/features/auth/useCurrentUser.ts`:
  - Configured `staleTime: 5 * 60 * 1000` (5 minutes) and `refetchOnWindowFocus: false` so `/api/v1/me` is not repeatedly requested when unauthenticated.
- `frontend/src/features/auth/usePublicConfig.ts`:
  - Created shared React Query hook for `/api/v1/public/config` with 5-minute `staleTime` and deduplication.
- `frontend/src/features/auth/sign-in-page.tsx`:
  - Configured `/api/v1/public/capacity` query with 5-minute `staleTime`, `retry: false`, and `refetchOnWindowFocus: false`.
- `frontend/src/features/auth/components/sign-in-left-column.tsx`:
  - Replaced raw `useEffect` with `usePublicConfig()`.
  - Added specific friendly error copy for backend error codes: `account_deleted`, `provisioning_failed`, `session_save_failed`, `account_disabled`, `account_locked`, `oauth_error`, `access_denied`, `invalid_token`, and `failed`.

### Deployment & Environment Templates
- `.env.example` & `render-env.template`:
  - Documented `RATE_LIMIT_UNAUTH_PER_MINUTE` and `RATE_LIMIT_AUTH_PER_MINUTE`.

---

## (c) New Environment Variables

| Variable Name | Required in Prod? | Default | What It Does | Example Value |
|---|---|---|---|---|
| `RATE_LIMIT_UNAUTH_PER_MINUTE` | No | `120` | Maximum unauthenticated requests allowed per minute per visitor IP for non-exempt endpoints. | `120` |
| `RATE_LIMIT_AUTH_PER_MINUTE` | No | `600` | Maximum requests allowed per minute per authenticated user account. | `600` |

---

## (d) Frontend Request Counts (Before vs. After)

### Sign-in Page Load Requests:
- **Before:**
  - `GET /api/v1/me`: 1 initial + 3 React Query retries on 401 = 4 requests
  - `GET /api/v1/public/capacity`: 1 initial request (refetched on window focus)
  - `GET /api/v1/public/config`: 1 request from raw useEffect on every mount/render
  - Duplicate hook triggers across components without query deduplication: 1-3 additional calls
  - **Total Before:** **6 to 9+ requests per page load** (triggering instant 429 toast storms under shared proxy IP).
- **After:**
  - `GET /api/v1/me`: Exactly **1** request (returns 401, no retries, cached for 5 minutes).
  - `GET /api/v1/public/capacity`: Exactly **1** request (cached for 5 minutes, no window focus refetch).
  - `GET /api/v1/public/config`: Exactly **1** request (cached for 5 minutes via `usePublicConfig`).
  - **Total After:** **Exactly 3 requests per page load**.

---

## (e) How to Verify Manually

1. **Verify Sign-in Page Load:**
   - Open browser Developer Tools -> Network tab.
   - Navigate to `/login`.
   - Verify exactly three API calls are made: `/api/v1/me`, `/api/v1/public/capacity`, and `/api/v1/public/config`.
   - Verify no 429 "Too many requests" toasts appear.
   - Switch browser tabs and switch back: verify neither `/api/v1/me` nor the public endpoints refetch.
2. **Verify Error Code Display:**
   - Navigate to `/login?error=account_deleted`. Verify the banner displays: *"Your account has been deleted. Please contact support if you believe this was an error."*
   - Navigate to `/login?error=session_save_failed`. Verify the banner displays: *"Unable to establish an authenticated session. Please verify cookie settings and try again."*
   - Navigate to `/login?error=access_denied`. Verify the banner displays: *"You cancelled the sign-in. Nothing was changed."*
3. **Verify OAuth Sign-in Flow:**
   - Click "Continue with GitHub" or "Continue with Google".
   - Complete authentication with provider.
   - Verify browser redirects to `/app/home` or `/onboarding` without 401 or 429 errors.
4. **Verify Advisory Lock & Cleanup Logs:**
   - In Render logs, observe that scheduled hourly pruning runs cleanly without `PSQLException` or `bad SQL grammar`.

---

## (f) Rollback Notes

If rollback is needed:
1. Revert Git commit: `git revert HEAD`.
2. Push branch: `git push origin system_design`.
3. Database migration `V48` only adds `IF NOT EXISTS` constructs and does not drop tables or columns; no rollback SQL is required.

---

## (g) Decisions and Assumptions

1. **IP Resolution Behind Vercel:**
   - When `PROXY_SHARED_SECRET` is unset, we trust `x-vercel-forwarded-for` directly because Vercel sets this header for all incoming requests.
   - **Residual Spoofing Risk:** If an attacker can reach Render directly (bypassing Vercel) while `PROXY_SHARED_SECRET` is not set, they could forge `x-vercel-forwarded-for` to spoof arbitrary IP literals. This spoofing risk is strictly limited to dodging the unauthenticated per-IP rate limiter (nothing else, as identity/authorization relies on authenticated sessions and OAuth tokens). To fully eliminate this residual risk, configure `PROXY_SHARED_SECRET` on Render and Vercel.
2. **PostgreSQL Timestamp Binding:**
   - Passing `java.time.Instant` to `JdbcClient.param()` was causing `PSQLException: Can't infer the SQL type to use for an instance of java.time.Instant`. We converted parameters to `java.sql.Timestamp.from(instant)` which PostgreSQL JDBC natively handles.
3. **Advisory Lock Key Deduplication:**
   - Unique lock IDs were assigned across all scheduled jobs (`1001` through `1011`) so no two jobs compete for the same PostgreSQL advisory lock.

---

## (h) Remaining Risks / Follow-ups

- To ensure no requests can bypass Vercel to Render, set `PROXY_SHARED_SECRET` on Render and send the matching `x-proxy-secret` header in Vercel's rewrite rules.

---

## (i) Things the Human Owner Must Do Outside Code

1. **Render Dashboard:**
   - In Render Environment Settings, you may optionally set:
     - `RATE_LIMIT_UNAUTH_PER_MINUTE=120` (or higher if your site experiences heavy public browsing)
     - `RATE_LIMIT_AUTH_PER_MINUTE=600`
2. **Deploy Branch:**
   - Ensure Render builds from the latest commit on `system_design`.

