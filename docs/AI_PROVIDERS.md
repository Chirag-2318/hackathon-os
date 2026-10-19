# AI Providers & Bring-Your-Own-Key (BYOK) Architecture

In [brackit], all artificial intelligence capabilities—such as brief field extraction, idea synthesis, plan generation, task generation, Q&A flashcards, diagrams repair, and room naming—are routed exclusively through the centralized Spring Boot `AiService` gateway (`/api/v1/ai/*`).

The platform pays for **NO AI usage in production**. Every AI call uses the Groq API key of the acting user who triggered it.

> **Security Invariants:**
> 1. AI API keys are stored encrypted with AES-256-GCM using the server's encryption key with a random 12-byte IV per record.
> 2. Decrypted keys are NEVER returned to the client, logged, or cached in memory.
> 3. All log statements and client error messages pass through automatic redaction masking Groq keys (`gsk_...`) and Authorization headers.
> 4. No `VITE_*` environment variable holds an AI secret.

---

## Bring-Your-Own-Key (BYOK) Model

1. **User Key Storage**:
   - `PUT /api/v1/users/me/ai-key`: Saves the user's key after verifying against Groq's `/models` endpoint (10-second timeout).
   - `GET /api/v1/users/me/ai-key`: Returns key status, last 4 digits, status, and provider host (`api.groq.com`).
   - `DELETE /api/v1/users/me/ai-key`: Deletes the user's stored key.
   - `POST /api/v1/users/me/ai-key/test`: Runs an 8-token ping test completion.

2. **Per-User Concurrency & Rate Limits**:
   - Each user is capped at **2 concurrent AI requests** simultaneously.
   - Per-user rate limiting is enforced via leaky-bucket rate limiter.
   - Speech-to-text (STT) for rehearsal feedback runs against Groq Whisper using the acting user's key.

---

## Error Codes & Client Contract

| Error Code | HTTP Status | Description & User Feedback |
|---|---|---|
| `AI_KEY_MISSING` | 403 Forbidden | Acting user has no Groq key configured. Prompts user to add their key. |
| `AI_KEY_INVALID` | 400 Bad Request | Upstream Groq returned 401/403. Key status marked `INVALID`. Prompts user to check key in Settings. |
| `AI_KEY_RATE_LIMITED` | 429 Too Many Requests | Upstream Groq returned 429. Returns `retryAfterSeconds` from `Retry-After` header. Never sleeps > 3s inside request. |
| `AI_RESTRICTED_BY_EVENT` | 403 Forbidden | Room brief event policy prohibits AI usage. |
| `AI_UNAVAILABLE` | 503 Service Unavailable | Upstream Groq 5xx, timeout, or network failure. Opens global circuit breaker only on upstream 5xx/timeouts. |

---

## Running Locally with a Platform Key (Dev Only)

To develop locally without entering a personal Groq key into the UI for each test account, you can enable the platform fallback:

```bash
# In backend/.env or your local environment:
SPRING_PROFILES_ACTIVE=dev
AI_PLATFORM_FALLBACK=true
AI_PLATFORM_KEY=gsk_your_groq_dev_key_here
```

> **IMPORTANT:**
> `AI_PLATFORM_FALLBACK` is strictly ignored unless `SPRING_PROFILES_ACTIVE` includes `dev`. In production or staging profiles, platform fallback is completely disabled.

---

## Features Resilient Without a Key

Without an AI key, the platform remains fully functional:
- **Plan Prompt Fusion**: The "Judge the idea" stage is skipped (`analysisState: SKIPPED_NO_KEY`), deterministic analysis is used, and the generated plan prompt is ready for manual copy-and-upload to external LLMs.
- **Hackathon Feed, Tasks, Docs, Team, Demo, Submission**: All non-AI features continue working without interruption.
