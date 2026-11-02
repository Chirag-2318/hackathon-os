# 2. Tech Stack & Versions

## 2.1 Runtime Environments & Languages
- **Backend Runtime**: Java 25 (Eclipse Temurin JDK/JRE 25 on Alpine Linux: `eclipse-temurin:25-jdk-alpine` builder, `eclipse-temurin:25-jre-alpine` runtime; defined in [backend/Dockerfile](file:///backend/Dockerfile#L2-L16)).
- **Backend Build System**: Apache Maven 3.9+ with included wrapper (`backend/mvnw`, `backend/.mvn/wrapper/maven-wrapper.properties`).
- **Frontend Runtime**: Node.js 20+ (Engine requirement: `>=20.0.0`; tested on Node v22.17.0).
- **Frontend Package Manager**: npm 10+ (`frontend/package.json`).
- **Database Engine**: PostgreSQL 17 (`postgres:17-alpine` in [docker-compose.yml](file:///docker-compose.yml#L2), Render PostgreSQL 17 in production).
- **MCP Server Runtime**: Node.js 20+ with TypeScript (`mcp-server/package.json`).

## 2.2 Backend Frameworks & Key Libraries
Extracted directly from [backend/pom.xml](file:///backend/pom.xml#L5-L130):
| Component / Library | Version | Purpose |
|---|---|---|
| `spring-boot-starter-parent` | `4.1.1` | Core Spring Boot application framework and dependency management |
| `spring-boot-starter-webmvc` | `4.1.1` | Embedded Apache Tomcat servlet container, REST controllers, MVC pipeline |
| `spring-boot-starter-security` | `4.1.1` | Authentication filters, session management, CSRF protection, RBAC |
| `spring-boot-starter-oauth2-client`| `4.1.1` | OAuth2 login flows for GitHub and Google identity providers |
| `spring-boot-starter-data-jpa` | `4.1.1` | Hibernate ORM, Spring Data repositories, HikariCP connection pool |
| `spring-boot-starter-flyway` | `4.1.1` | Database schema migrations management |
| `flyway-database-postgresql` | `10.x` | PostgreSQL-specific Flyway database driver extensions |
| `org.postgresql:postgresql` | `42.7.x` | Official PostgreSQL JDBC driver |
| `spring-boot-starter-validation` | `4.1.1` | Jakarta Bean Validation (`@Valid`, `@NotNull`, `@Size`, etc.) |
| `spring-boot-starter-mail` | `4.1.1` | JavaMailSender integration for transactional SMTP email dispatch |
| `spring-boot-starter-actuator` | `4.1.1` | Liveness/readiness health probes (`/actuator/health`) |
| `org.springdoc:springdoc-openapi-starter-webmvc-ui` | `3.1.1` | Swagger UI & OpenAPI 3.0 generation (disabled in `application-prod.yml`) |
| `io.swagger.parser.v3:swagger-parser` | `2.1.25` | Parsing and validating uploaded OpenAPI 3.0 specs in API Hub |
| `org.jsoup:jsoup` | `1.18.3` | HTML DOM parsing, content sanitization, SSRF-safe link extraction |
| `org.apache.pdfbox:pdfbox` | `3.0.3` | Extracting raw text from uploaded hackathon brief PDF documents |
| `org.apache.poi:poi-ooxml` | `5.4.0` | Parsing Microsoft PowerPoint (`.pptx`) decks for slide analysis |

## 2.3 Frontend Frameworks & Key Libraries
Extracted directly from [frontend/package.json](file:///frontend/package.json#L13-L82):
| Package | Version | Purpose |
|---|---|---|
| `react` & `react-dom` | `19.2.8` | Core UI rendering engine (React 19) |
| `react-router-dom` | `7.18.4` | Client-side routing, layout nesting, protected route guards |
| `vite` | `8.3.0` | Frontend dev server and production bundler |
| `@tailwindcss/vite` & `tailwindcss` | `4.3.3` | Modern Tailwind CSS v4 engine with CSS theme variables |
| `@tanstack/react-query` | `5.103.1` | Asynchronous server state caching, background invalidation, polling |
| `@tanstack/react-table` | `8.19.3` | Headless data tables for task lists and admin overviews |
| `zustand` | `5.0.15` | Client-only global stores (drafts, UI drawers, tour spotlight, auth cache) |
| `radix-ui` / `@radix-ui/*` | `1.6.7` | Accessible unstyled primitives for dialogs, dropdowns, tooltips |
| `framer-motion` | `13.4.2` | Page transitions, stage unlock animations, micro-interactions |
| `lucide-react` & `@tabler/icons-react`| `1.47.0` / `3.48.0` | UI icon libraries |
| `@uiw/react-codemirror` | `4.25.11` | Markdown document editing in Docs vault with syntax highlighting |
| `@dnd-kit/core` & `@dnd-kit/sortable`| `6.3.1` / `10.0.0` | Drag-and-drop mechanics for Kanban sprint task columns |
| `mermaid` | `12.0.0` | Dynamic rendering of architecture & system sequence diagrams |
| `recharts` | `3.8.0` | Burndown velocity charts, attention telemetry, workload visualization |
| `rehype-sanitize` & `react-markdown`| `6.0.0` / `10.1.0` | Secure XSS-sanitized rendering of markdown and generated plans |
| `sonner` | `2.0.8` | Toast notification system for live room events and errors |
| `zod` | `4.6.5` | Schema validation for forms and API contracts |

## 2.4 Frontend <-> Backend Relationship
The application is strictly separated into a **Single Page Application (SPA)** and a **REST/SSE Backend Monolith**:
1. **Production Deployment Topology**:
   - The frontend is compiled into static HTML/JS/CSS bundles via `tsc -b && vite build` and hosted on Vercel's Edge Network CDN.
   - The backend runs as a single containerized Docker web service on Render (`hackathon-os-backend`).
2. **Reverse Proxy Architecture ([frontend/vercel.json](file:///frontend/vercel.json#L3-L9))**:
   To avoid third-party cookie restrictions (e.g. Chrome tracking protection, Safari ITP), the frontend never makes direct cross-origin calls to the Render domain in the browser. Instead, Vercel proxies four path prefixes directly to Render:
   - `/api/:path*` -> `https://${RENDER_HOST}/api/:path*`
   - `/oauth2/:path*` -> `https://${RENDER_HOST}/oauth2/:path*`
   - `/login/oauth2/:path*` -> `https://${RENDER_HOST}/login/oauth2/:path*`
   - `/uploads/:path*` -> `https://${RENDER_HOST}/uploads/:path*`
   - All other routes fall back to `/index.html` for React Router resolution.
3. **Cookie Domain Scope**:
   Because of Vercel's reverse proxy rewrites, cookies (`JSESSIONID`, `XSRF-TOKEN`) are set directly on the Vercel domain (`appProperties.getCookie().getSameSite()` defaults to `Lax`, `secure=true`). Cookies are host-only (`COOKIE_DOMAIN=""`), preventing cross-site leakage.
