# ADR 0006: Web frontends: two React + Vite SPAs with Mantine

**Status:** Accepted (Oct 6, 2026)

## Context
A public, mobile-friendly customer Portal (A5) and an internal staff Console (also the Windows app's UI). No SEO needs, no customer accounts, low traffic.

## Decision
Two single-page apps, **`apps/portal`** and **`apps/console`**, built with **React + Vite + TypeScript**, the **Mantine** component library, React Router, and TanStack Query, sharing `packages/ui` and the generated API client. They are built to static files and served by Caddy in the `helpdesk-web` image; the API is same-origin under `/api`.

## Alternatives considered
- **Next.js (server-rendered):** strong, but adds a Node rendering server and complexity we don't need (no SEO, no SSR requirement).
- **One combined SPA:** would ship staff code to the public and blur security boundaries.
- **shadcn/ui + Tailwind:** very popular, but copies component code into the repo (more code to maintain); Mantine is batteries-included (forms, tables, dates, notifications).

## Consequences
- Static hosting is trivial and cache-friendly; no server-side rendering to secure.
- Strict CSP is easy (no inline scripts).
- Portal and Console can be built and tested independently by different agents.
