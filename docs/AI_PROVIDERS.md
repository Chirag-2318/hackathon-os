# AI Providers & Backend Gateway Architecture

In Hackathon OS, all artificial intelligence capabilities—such as brief field extraction, idea synthesis, task generation, Q&A flashcards, and room naming—are routed exclusively through the centralized Spring Boot `AiService` gateway (`/api/v1/ai/*`).

> **Security Invariant (Rule 13):** AI API keys and upstream provider credentials NEVER reach the browser. The frontend interacts strictly with backend endpoints and reads operational status via `GET /api/v1/ai/status`. No `VITE_*` environment variable holds an AI secret.

---

## Gateway Environment Variables

The backend gateway is configured via the following environment variables:

| Variable | Description |
|---|---|
| `AI_BASE_URL` | Base URL of the OpenAI-compatible HTTP inference gateway |
| `AI_API_KEY` | Upstream provider secret key (stored server-side only) |
| `AI_MODEL_DEFAULT` | Canonical balanced model for generation and analysis |
| `AI_MODEL_FAST` | Low-latency model for rapid tasks (e.g. naming, validation) |
| `AI_MODEL_SMART` | High-reasoning model for PRD drafting and architecture reviews |
| `AI_JSON_MODE_SUPPORTED` | Boolean flag indicating whether the provider supports structured JSON mode (`response_format: { type: "json_object" }`) |
| `STT_BASE_URL` | Base URL for speech-to-text / transcription inference |
| `STT_API_KEY` | Upstream secret for audio transcription services |
| `STT_MODEL` | Transcription model identifier (e.g., `whisper-large-v3`) |

---

## Provider Comparison & Configuration

| Configuration Key | Groq (Current Production) | Self-Hosted OSS (Planned: vLLM / SGLang / Kimi) |
|---|---|---|
| `AI_BASE_URL` | `https://api.groq.com/openai/v1` | `http://vllm-server.internal:8000/v1` |
| `AI_API_KEY` | `gsk_********************************` | `none` or internal cluster token |
| `AI_MODEL_DEFAULT` | `llama-3.3-70b-versatile` | `kimi-k1.5` or `Qwen/Qwen2.5-72B-Instruct` |
| `AI_MODEL_FAST` | `llama-3.1-8b-instant` | `Qwen/Qwen2.5-7B-Instruct` |
| `AI_MODEL_SMART` | `llama-3.3-70b-versatile` | `deepseek-ai/DeepSeek-R1-Distill-Qwen-32B` |
| `AI_JSON_MODE_SUPPORTED` | `true` | `true` (if guided decoding / outlines enabled in vLLM) |
| `STT_BASE_URL` | `https://api.groq.com/openai/v1` | `http://whisper.internal:9000/v1` |
| `STT_MODEL` | `whisper-large-v3` | `Systran/faster-whisper-large-v3` |

---

## Provider Switching Checklist

When switching upstream AI providers:
1. **Set Base URL and Model Name**: Update `AI_BASE_URL`, `AI_MODEL_DEFAULT`, and `AI_MODEL_FAST` in the backend environment.
2. **Verify JSON Mode Support**: Set `AI_JSON_MODE_SUPPORTED=false` if the target inference server does not support grammar-based JSON constraint generation; the backend will fall back to prompt-enforced JSON extraction.
3. **Verify Context & Output Limits**: Check that the model supports at least 32,768 tokens of context window for full room brief and document ingestion.
4. **Tune Concurrency**: Adjust backend connection pool and concurrency limits to match the throughput capabilities and GPU VRAM of your local inference engine.
5. **Configure Speech-to-Text Separately**: Verify audio transcription parameters under `STT_*` independently of text completion models.
6. **Verify Gateway Status**: Call `GET /api/v1/ai/status` and verify that the Settings > AI Status panel reports `Operational` with valid latency.
