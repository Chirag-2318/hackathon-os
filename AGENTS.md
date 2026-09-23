# AGENTS.md

* Use only the libraries listed in `docs/tech_stack.md`. Do not add a dependency without asking.
* Use the generated API client. Do not write hand-written `fetch` calls.
* Never store auth tokens or user data in `localStorage` or `sessionStorage`.
* Never put secrets in `VITE_*`.
* Never render pasted or AI-generated Markdown/HTML without a sanitizer.
* Every new screen needs loading, empty, and error states, plus a Playwright test.
* Use shadcn/ui and Tailwind theme tokens. Do not use custom colors or spacing outside the theme tokens.
* Read `docs/problem.md`, `docs/ideation.md`, and the OpenAPI spec before feature work.
* Keep components small. No file over approximately 300 lines.
* Routing: use React Router. Do not introduce TanStack Router.
