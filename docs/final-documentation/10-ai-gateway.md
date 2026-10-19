# 10 — AI gateway

> Purpose: describe provider integration without overstating capability.
> Audience: operators and backend maintainers.
> Snapshot date: 2026-10-19.
> Source snapshot: `AiService`, `AiProperties`, `application.yml`.
> Status: Verified source; provider calls were not run.

`AiService` is the backend gateway and calls an injected `LlmClient`. User keys are resolved first; a configured platform key is a development fallback. Browser clients do not call providers directly. Configuration supports a Groq-compatible OpenAI-style base URL, default/fast/smart models, JSON mode, timeout, retries, concurrency, user rate and speech-to-text settings.

Observed defaults: timeout 45 seconds, retries 2, global concurrency 4, user rate 10/minute, enabled true. The service also applies room/user limiters and a per-user concurrency guard. Provider keys are secrets and must never be copied into documentation. This describes language-model gateway behavior only; it makes no machine-learning claim.
