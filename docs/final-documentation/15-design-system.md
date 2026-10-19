# 15 — Design system

> Purpose: describe implemented frontend presentation boundaries.
> Audience: frontend maintainers and designers.
> Snapshot date: 2026-10-19.
> Source snapshot: frontend package, CSS, shared components and route shell.
> Status: Verified at architecture level; visual audit not run.

The frontend uses Tailwind/Vite theme integration, shared components, responsive shell/layout components, Framer Motion globally, and feature-local screens. `rehype-sanitize` is present for rendered Markdown. Landing-specific process docs request CSS-only motion, but that does not mean the entire product avoids Framer Motion.

Font and token usage varies by subsystem; do not describe one universal font until CSS imports and token usage are reconciled. Terms/privacy are currently placeholder route components, not complete policy documents.
