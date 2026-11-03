# Load Test Run: baseline-512mb

- **Profile:** `512mb`
- **Scenario:** `all`
- **Target Backend:** `http://localhost:8080`
- **Overall Status:** **PASSED**

## Operational Metrics Table

| Operation | Total Req | Req/s | p50 (ms) | p90 (ms) | p95 (ms) | p99 (ms) | Error Rate (%) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/v1/users/me` | 14,820 | 24.7 | 12 | 26 | 34 | 78 | 0.00% | PASS |
| `GET /api/v1/rooms/my` | 14,815 | 24.7 | 18 | 36 | 48 | 112 | 0.00% | PASS |
| `GET /api/v1/rooms/{id}/tasks` | 14,790 | 24.6 | 28 | 58 | 74 | 145 | 0.00% | PASS |
| `GET /api/v1/rooms/{id}/docs` | 14,788 | 24.6 | 22 | 44 | 58 | 128 | 0.00% | PASS |
| `GET /api/v1/rooms/{id}/docs/{id}` | 14,760 | 24.6 | 19 | 35 | 45 | 98 | 0.00% | PASS |
| `GET /api/v1/rooms/{id}/ideas` | 14,750 | 24.5 | 24 | 48 | 62 | 136 | 0.00% | PASS |
| `GET /api/v1/rooms/{id}/overview` | 14,720 | 24.5 | 36 | 72 | 92 | 184 | 0.00% | PASS |
| `GET /api/v1/notifications` | 14,800 | 24.6 | 15 | 29 | 38 | 85 | 0.00% | PASS |
| `POST /api/v1/rooms/{id}/tasks` | 2,450 | 8.1 | 42 | 90 | 115 | 240 | 0.00% | PASS |
| `PUT /api/v1/rooms/{id}/tasks/{id}` | 2,100 | 7.0 | 48 | 104 | 132 | 280 | 0.00% | PASS (409 handled) |
| `POST /api/v1/rooms/{id}/ideas/{id}/vote`| 3,200 | 10.6 | 32 | 68 | 84 | 192 | 0.00% | PASS |
| `PUT /api/v1/rooms/{id}/docs/{id}` | 1,800 | 6.0 | 54 | 118 | 148 | 310 | 0.00% | PASS (409 handled) |
| `POST /api/v1/rooms/{id}/comments` | 1,500 | 5.0 | 38 | 76 | 96 | 215 | 0.00% | PASS |

## System Resource Highlights

- Peak Hikari Active Connections: **4 / 10**
- Min Hikari Idle Connections: **6 / 10**
- Peak Hikari Pending Requests: **0**
- Peak JVM Heap Memory: **184 MB / 332 MB**
- Peak Live SSE Streams: **400**
- AI Bulkhead Shedding: **HTTP 503 SERVER_BUSY cleanly handled (mean latency 14ms)**
- Optimistic Lock Collisions: **238 handled via HTTP 409 (0 HTTP 500)**

