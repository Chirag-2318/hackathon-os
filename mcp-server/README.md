# Brackit Model Context Protocol (MCP) Server

This is the official Node/TypeScript MCP server for **Brackit Hackathon OS**. It exposes a thin, stateless Model Context Protocol (MCP) interface that connects LLMs (such as Claude Desktop, Cursor, or ChatGPT desktop adapters) to the Brackit Spring Boot backend.

---

## 1. Features & Architecture

- **Protocol**: MCP specification compliant using `@modelcontextprotocol/sdk`.
- **Transport**: **Streamable HTTP** hosted at `POST /mcp` in **stateless mode** (`sessionIdGenerator: undefined`). A fresh `McpServer` and transport are instantiated per request, ensuring no cross-request state contamination or session coupling.
- **Authentication**: Extracts the incoming `Authorization: Bearer <token>` header and forwards it on every backend call using a closure-scoped backend client. In non-production environments (`NODE_ENV !== 'production'`), falls back to `BRACKIT_DEV_TOKEN` if no header is supplied. Unauthenticated calls return `401 {"error":"unauthorized"}` via a dedicated `unauthorized(res)` handler designed for future OAuth discovery headers.
- **Privacy & Security**: Tokens and raw document contents are **never** logged. Logs capture only operational telemetry: `requestId`, `tool`, backend `status`, and execution `durationMs`.
- **Resilience**: 60-second timeouts to accommodate Render free-tier cold starts, and automatic single retry on GET network errors, 502, and 503 status codes. State-mutating POST submissions are never retried.

---

## 2. Environment Variables

The server validates environment configuration at startup using Zod and fails fast with actionable error messages:

| Variable | Description | Default | Notes |
| :--- | :--- | :--- | :--- |
| `PORT` | Local port to bind the Express server | `3000` | Must be a valid port (1–65535) |
| `BRACKIT_API_BASE_URL` | Base URL of the Brackit Spring Boot backend | `http://localhost:8080` | Trailing slashes are automatically stripped |
| `BRACKIT_DEV_TOKEN` | Fallback raw token (`bkt_...`) | _None_ | **Ignored in production** (`NODE_ENV === 'production'`) |
| `NODE_ENV` | Environment mode (`development`, `test`, `production`) | `development` | In `production`, dev tokens are strictly disabled |

---

## 3. Installation & Local Development

### Prerequisites
- Node.js 20 or higher
- npm

### Installation
From the repository root or inside `mcp-server/`:
```bash
cd mcp-server
npm install
```

### Available npm Scripts
- `npm run dev`: Runs the server with live reloading via `tsx watch src/index.ts`.
- `npm run build`: Compiles TypeScript files to `dist/` using strict ESM options.
- `npm start`: Runs the compiled server (`node dist/index.js`).
- `npm test`: Executes the Vitest test suite (unit and integration tests).
- `npm run lint`: Validates TypeScript types across the codebase without emitting artifacts (`tsc --noEmit`).

---

## 4. MCP Tools & Prompts

### Available Tools
1. **`list_rooms`** (Read-only):
   - Arguments: None.
   - Output: Lists all active rooms where the user is a member, including room name, UUID, lifecycle stage, and role.
2. **`get_plan_steps`** (Read-only):
   - Arguments: `{ roomId: string }`.
   - Output: Returns the 5 sequential planning steps (`prd`, `tech`, `phases`, `tasks`, `demo`) with status and expected markdown files.
3. **`get_step_brief`** (Read-only):
   - Arguments: `{ roomId: string, step: "prd" | "tech" | "phases" | "tasks" | "demo" }`.
   - Output: Structured sections containing `## EXPECTED FILES`, `## INSTRUCTIONS (follow exactly)`, `## PROJECT CONTEXT`, and deep-link `webUrl`.
4. **`submit_step_document`**:
   - Arguments: `{ roomId: string, step: string, text: string, confirm?: boolean, override?: boolean }`.
   - Rejects text payloads over 200,000 characters before hitting the network.
   - On success: Short confirmation with `webUrl`.
   - On validation failure: Formats validation errors and outputs the verbatim repair instructions under `## FIX AND RESUBMIT`.
   - On warnings (`needsConfirmation: true`): Informs the model to request user confirmation before resubmitting with `confirm=true`.

### Available Prompts (Slash Commands)
- `/prd [room]`: Generate PRD & MVP bundle for a Brackit room.
- `/tech [room]`: Generate Tech Stack & Architecture for a Brackit room.
- `/phases [room]`: Generate Implementation Phases & Design for a Brackit room.
- `/tasks [room]`: Generate Tasks breakdown for a Brackit room.
- `/demo [room]`: Generate Demo script & Judge Q&A for a Brackit room.

Each prompt executes an automated 6-step loop:
1. Room resolution (by UUID or case-insensitive name match).
2. Brief retrieval.
3. Document generation using delimiter conventions (`=====FILE: filename=====\n...\n=====END FILE=====`).
4. Automatic repair loop (up to 3 attempts).
5. Confirmation gate for non-fatal warnings.
6. Concise 3-5 line summary and Brackit web app deep link.

---

## 5. Testing with MCP Inspector

You can interactively inspect, execute tools, and preview prompts using the official `@modelcontextprotocol/inspector`:

1. Start your local Brackit backend (on port 8080) and MCP server (on port 3000):
   ```bash
   cd mcp-server
   npm run dev
   ```
2. Launch the MCP Inspector in a separate terminal:
   ```bash
   npx @modelcontextprotocol/inspector
   ```
3. In the Inspector UI:
   - **Transport Type**: Select `Streamable HTTP` (or HTTP).
   - **URL**: `http://localhost:3000/mcp`
   - **Request Headers**: Add:
     - Header Name: `Authorization`
     - Header Value: `Bearer <your_bkt_token_here>`
4. Click **Connect**.
5. You can now browse the **Tools** tab to test `list_rooms` or `get_step_brief`, and browse the **Prompts** tab to inspect prompt instructions.

---

## 6. Running the Manual Test Script

A standalone automated test script is provided in `scripts/test-manual.mjs`.

To run against your running local backend and MCP server:
```bash
# Pass your minted Brackit Bearer token:
BRACKIT_TOKEN="bkt_..." node scripts/test-manual.mjs
```

The script will:
1. Verify `GET /health` on the MCP server.
2. Connect using the official `@modelcontextprotocol/sdk` client over Streamable HTTP.
3. List registered tools and prompts.
4. Execute `list_rooms`.
5. Preview instructions for the `prd` prompt.

---

## 7. Containerization (Docker)

Build the production multi-stage container:
```bash
docker build -t brackit-mcp-server .
```

Run the container as a non-root user (`node`):
```bash
docker run -p 3000:3000 \
  -e BRACKIT_API_BASE_URL="http://host.docker.internal:8080" \
  brackit-mcp-server
```
